import type {
    MemoryStore,
    StudentFacts,
    StudentSummary,
    AtomicFact,
    FactCategory,
    DailyNotes,
    SessionEntry,
    TacitKnowledge,
    DecayTier,
    TieredFact,
} from './memoryTypes';

const STORAGE_KEY = 'chess-kids-memory';

// ============================================
// Memory Decay Configuration
// ============================================

const DECAY_CONFIG = {
    HOT_DAYS: 7,
    WARM_DAYS: 30,
    FREQUENCY_RESISTANCE_THRESHOLD: 5, // High access count resists decay
};

// ============================================
// Utility Functions
// ============================================

function generateId(): string {
    return `fact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

function daysSince(dateString: string): number {
    const then = new Date(dateString).getTime();
    const now = Date.now();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function getDecayTier(fact: AtomicFact): DecayTier {
    const days = daysSince(fact.lastAccessed);

    // High frequency facts resist decay
    if (fact.accessCount >= DECAY_CONFIG.FREQUENCY_RESISTANCE_THRESHOLD && days < DECAY_CONFIG.WARM_DAYS) {
        return 'hot';
    }

    if (days <= DECAY_CONFIG.HOT_DAYS) return 'hot';
    if (days <= DECAY_CONFIG.WARM_DAYS) return 'warm';
    return 'cold';
}

// ============================================
// Core Memory Service
// ============================================

class MemoryService {
    private store: MemoryStore;

    constructor() {
        this.store = this.loadFromStorage();
    }

    private loadFromStorage(): MemoryStore {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load memory store:', e);
        }
        return this.createEmptyStore();
    }

    private createEmptyStore(): MemoryStore {
        return {
            students: {},
            summaries: {},
            sessions: {},
            tacit: {
                lastUpdated: new Date().toISOString(),
                globalPatterns: {
                    defaultHintStyle: 'visual',
                    defaultVerbosity: 'concise',
                    celebrationIntensity: 'high',
                },
                rules: [
                    'Always use encouraging language',
                    'Prefer arrows over text for spatial concepts',
                ],
            },
        };
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
        } catch (e) {
            console.error('Failed to save memory store:', e);
        }
    }

    // ============================================
    // Student Facts (Layer 1)
    // ============================================

    async getStudentFacts(profileId: string): Promise<StudentFacts> {
        if (!this.store.students[profileId]) {
            this.store.students[profileId] = { profileId, facts: [] };
        }
        return this.store.students[profileId];
    }

    async getActiveFacts(profileId: string): Promise<AtomicFact[]> {
        const facts = await this.getStudentFacts(profileId);
        return facts.facts.filter(f => f.status === 'active');
    }

    async getTieredFacts(profileId: string): Promise<TieredFact[]> {
        const facts = await this.getActiveFacts(profileId);
        return facts.map(fact => ({
            ...fact,
            tier: getDecayTier(fact),
        }));
    }

    async getHotAndWarmFacts(profileId: string): Promise<TieredFact[]> {
        const facts = await this.getTieredFacts(profileId);
        return facts.filter(f => f.tier !== 'cold');
    }

    async addFact(
        profileId: string,
        fact: string,
        category: FactCategory,
        source: string,
        relatedEntities: string[] = []
    ): Promise<AtomicFact> {
        const newFact: AtomicFact = {
            id: generateId(),
            fact,
            category,
            timestamp: new Date().toISOString(),
            source,
            status: 'active',
            supersededBy: null,
            relatedEntities,
            lastAccessed: new Date().toISOString(),
            accessCount: 1,
        };

        const studentFacts = await this.getStudentFacts(profileId);
        studentFacts.facts.push(newFact);
        this.saveToStorage();
        return newFact;
    }

    async accessFact(profileId: string, factId: string): Promise<void> {
        const studentFacts = await this.getStudentFacts(profileId);
        const fact = studentFacts.facts.find(f => f.id === factId);
        if (fact) {
            fact.accessCount++;
            fact.lastAccessed = new Date().toISOString();
            this.saveToStorage();
        }
    }

    async supersedeFact(profileId: string, oldFactId: string, newFact: string): Promise<AtomicFact> {
        const studentFacts = await this.getStudentFacts(profileId);
        const oldFactObj = studentFacts.facts.find(f => f.id === oldFactId);

        if (!oldFactObj) {
            throw new Error(`Fact ${oldFactId} not found`);
        }

        // Create the new fact
        const created = await this.addFact(
            profileId,
            newFact,
            oldFactObj.category,
            `superseded-${oldFactId}`,
            oldFactObj.relatedEntities
        );

        // Mark old fact as superseded
        oldFactObj.status = 'superseded';
        oldFactObj.supersededBy = created.id;
        this.saveToStorage();

        return created;
    }

    // ============================================
    // Student Summary (Synthesized View)
    // ============================================

    async getStudentSummary(profileId: string): Promise<StudentSummary> {
        const existing = this.store.summaries[profileId];
        if (existing) return existing;

        // Generate fresh summary
        return this.regenerateSummary(profileId);
    }

    async regenerateSummary(profileId: string): Promise<StudentSummary> {
        const hotWarmFacts = await this.getHotAndWarmFacts(profileId);

        const strengths = hotWarmFacts
            .filter(f => f.category === 'strength')
            .map(f => f.fact);

        const gaps = hotWarmFacts
            .filter(f => f.category === 'skill-gap')
            .map(f => f.fact);

        const preferencesFact = hotWarmFacts.find(f => f.category === 'preference' && f.fact.includes('hint'));
        const hintStyle = preferencesFact?.fact.includes('visual') ? 'visual' :
            preferencesFact?.fact.includes('text') ? 'text' : 'both';

        const summary: StudentSummary = {
            profileId,
            lastUpdated: new Date().toISOString(),
            summary: {
                currentSkillLevel: 'beginner', // Could be computed from milestones
                recentStrengths: strengths.slice(0, 5),
                recentGaps: gaps.slice(0, 5),
                preferredHintStyle: hintStyle,
                lessonsCompleted: hotWarmFacts.filter(f => f.category === 'milestone').length,
                totalStars: 0, // Will be synced from ProfileContext
            },
        };

        this.store.summaries[profileId] = summary;
        this.saveToStorage();
        return summary;
    }

    // ============================================
    // Session Notes (Layer 2)
    // ============================================

    getTodaySessions(): DailyNotes {
        const today = getToday();
        if (!this.store.sessions[today]) {
            this.store.sessions[today] = { date: today, sessions: [] };
        }
        return this.store.sessions[today];
    }

    async startSession(profileId: string, lessonId: number): Promise<SessionEntry> {
        const session: SessionEntry = {
            profileId,
            lessonId,
            startTime: new Date().toISOString(),
            objectivesCompleted: [],
            objectivesFailed: [],
            tutorInteractions: 0,
            hintsGiven: [],
        };

        this.getTodaySessions().sessions.push(session);
        this.saveToStorage();
        return session;
    }

    updateCurrentSession(profileId: string, updates: Partial<SessionEntry>): void {
        const todaySessions = this.getTodaySessions().sessions;
        const currentSession = todaySessions.find(
            s => s.profileId === profileId && !s.endTime
        );

        if (currentSession) {
            Object.assign(currentSession, updates);
            this.saveToStorage();
        }
    }

    async endSession(profileId: string): Promise<void> {
        this.updateCurrentSession(profileId, { endTime: new Date().toISOString() });
    }

    async recordTutorInteraction(
        profileId: string,
        type: 'arrow' | 'highlight' | 'message',
        context: string,
        response: string
    ): Promise<void> {
        const todaySessions = this.getTodaySessions().sessions;
        const currentSession = todaySessions.find(
            s => s.profileId === profileId && !s.endTime
        );

        if (currentSession) {
            currentSession.tutorInteractions++;
            currentSession.hintsGiven.push({ type, context, response });
            this.saveToStorage();
        }
    }

    async recordObjectiveCompleted(profileId: string, objectiveId: string): Promise<void> {
        const todaySessions = this.getTodaySessions().sessions;
        const currentSession = todaySessions.find(
            s => s.profileId === profileId && !s.endTime
        );

        if (currentSession && !currentSession.objectivesCompleted.includes(objectiveId)) {
            currentSession.objectivesCompleted.push(objectiveId);
            this.saveToStorage();
        }
    }

    // ============================================
    // Tacit Knowledge (Layer 3)
    // ============================================

    getTacitKnowledge(): TacitKnowledge {
        return this.store.tacit;
    }

    async updateTacitKnowledge(updates: Partial<TacitKnowledge['globalPatterns']>): Promise<void> {
        Object.assign(this.store.tacit.globalPatterns, updates);
        this.store.tacit.lastUpdated = new Date().toISOString();
        this.saveToStorage();
    }

    async addRule(rule: string): Promise<void> {
        if (!this.store.tacit.rules.includes(rule)) {
            this.store.tacit.rules.push(rule);
            this.store.tacit.lastUpdated = new Date().toISOString();
            this.saveToStorage();
        }
    }

    // ============================================
    // Context for AI Prompt
    // ============================================

    async getContextForAI(profileId: string): Promise<string> {
        const summary = await this.getStudentSummary(profileId);
        const tacit = this.getTacitKnowledge();

        let context = `## Student Profile\n`;
        context += `- Skill Level: ${summary.summary.currentSkillLevel}\n`;
        context += `- Lessons Completed: ${summary.summary.lessonsCompleted}\n`;
        context += `- Preferred Hint Style: ${summary.summary.preferredHintStyle}\n\n`;

        if (summary.summary.recentStrengths.length > 0) {
            context += `## Strengths\n`;
            summary.summary.recentStrengths.forEach(s => {
                context += `- ${s}\n`;
            });
            context += '\n';
        }

        if (summary.summary.recentGaps.length > 0) {
            context += `## Areas to Improve\n`;
            summary.summary.recentGaps.forEach(g => {
                context += `- ${g}\n`;
            });
            context += '\n';
        }

        context += `## Tutor Guidelines\n`;
        tacit.rules.forEach(r => {
            context += `- ${r}\n`;
        });

        return context;
    }
}

// Export singleton
export const memoryService = new MemoryService();
