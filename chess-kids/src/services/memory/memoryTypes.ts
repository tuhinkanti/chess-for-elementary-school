// Memory System Types based on PARA framework

// ============================================
// Atomic Fact Schema
// ============================================

export type FactCategory =
    | 'skill-gap'      // Areas where student struggles
    | 'strength'       // Things student does well
    | 'preference'     // Learning style preferences
    | 'milestone'      // Completed achievements
    | 'behavior';      // Session patterns

export type FactStatus = 'active' | 'superseded';

export interface AtomicFact {
    id: string;
    fact: string;
    category: FactCategory;
    timestamp: string;           // ISO date string
    source: string;              // e.g., "lesson-3" or session date
    status: FactStatus;
    supersededBy: string | null; // ID of the fact that replaced this one
    relatedEntities: string[];   // e.g., ["lessons/3", "pieces/knight"]
    lastAccessed: string;        // ISO date string
    accessCount: number;
}

// ============================================
// Student Knowledge Graph (Layer 1)
// ============================================

export interface StudentFacts {
    profileId: string;
    facts: AtomicFact[];
}

export interface StudentSummary {
    profileId: string;
    lastUpdated: string;
    summary: {
        currentSkillLevel: 'beginner' | 'intermediate' | 'advanced';
        recentStrengths: string[];
        recentGaps: string[];
        preferredHintStyle: 'visual' | 'text' | 'both';
        lessonsCompleted: number;
        totalStars: number;
    };
}

// ============================================
// Session Notes (Layer 2 - Daily Notes)
// ============================================

export interface TutorInteraction {
    type: 'arrow' | 'highlight' | 'message';
    context: string;
    response: string;
}

export interface SessionEntry {
    profileId: string;
    lessonId: number;
    startTime: string;
    endTime?: string;
    objectivesCompleted: string[];
    objectivesFailed: string[];
    tutorInteractions: number;
    hintsGiven: TutorInteraction[];
    notes?: string;
}

export interface DailyNotes {
    date: string;  // YYYY-MM-DD format
    sessions: SessionEntry[];
}

// ============================================
// Tacit Knowledge (Layer 3)
// ============================================

export interface TacitKnowledge {
    lastUpdated: string;
    globalPatterns: {
        defaultHintStyle: 'visual' | 'text' | 'both';
        defaultVerbosity: 'concise' | 'detailed';
        celebrationIntensity: 'low' | 'medium' | 'high';
    };
    rules: string[];
}

// ============================================
// Memory Decay Tiers
// ============================================

export type DecayTier = 'hot' | 'warm' | 'cold';

export interface TieredFact extends AtomicFact {
    tier: DecayTier;
}

// ============================================
// Full Memory Store (localStorage schema)
// ============================================

export interface MemoryStore {
    students: Record<string, StudentFacts>;
    summaries: Record<string, StudentSummary>;
    sessions: Record<string, DailyNotes>;  // keyed by date
    tacit: TacitKnowledge;
}
