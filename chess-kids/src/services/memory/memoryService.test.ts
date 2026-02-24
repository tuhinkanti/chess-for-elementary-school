import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.hoisted(() => {
    let store: Record<string, string> = {};
    const localStorageMock = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        },
    };

    Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true
    });
});

import { memoryService } from './memoryService';

describe('MemoryService', () => {
    const profileId = 'test-student-123';

    beforeEach(() => {
        localStorage.clear();
        // Re-initialize the service to clear the internal store
        // Since it's a singleton, we might need a way to reset it or just clear localStorage and hope for the best
        // In memoryService.ts, the store is initialized in the constructor.
        // To truly reset, we'd need to manually reach into the private store or re-instantiate.
        // For now, let's reset the store manually if possible or just rely on localStorage clear.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (memoryService as any).store = (memoryService as any).createEmptyStore();
    });

    it('initializes with an empty store', () => {
        const facts = memoryService.getStudentFacts(profileId);
        expect(facts.profileId).toBe(profileId);
        expect(facts.facts).toEqual([]);
    });

    it('adds a fact correctly', () => {
        const factText = 'Likes to use the Queen early';
        const category = 'preference';
        const source = 'tutor-observation';

        const fact = memoryService.addFact(profileId, factText, category, source);

        expect(fact.fact).toBe(factText);
        expect(fact.category).toBe(category);
        expect(fact.accessCount).toBe(1);

        const activeFacts = memoryService.getActiveFacts(profileId);
        expect(activeFacts.length).toBe(1);
        expect(activeFacts[0].id).toBe(fact.id);
    });

    it('accesses a fact and increments counter', () => {
        const fact = memoryService.addFact(profileId, 'Testing access', 'milestone', 'test');
        memoryService.accessFact(profileId, fact.id);

        const facts = memoryService.getStudentFacts(profileId).facts;
        const updatedFact = facts.find(f => f.id === fact.id);
        expect(updatedFact?.accessCount).toBe(2);
    });

    it('supersedes a fact correctly', () => {
        const oldFact = memoryService.addFact(profileId, 'Thinks pawns are weak', 'skill-gap', 'test');
        const newFactText = 'Learned that pawns are the soul of chess';

        const newFact = memoryService.supersedeFact(profileId, oldFact.id, newFactText);

        const facts = memoryService.getStudentFacts(profileId).facts;
        const oldFactObj = facts.find(f => f.id === oldFact.id);

        expect(oldFactObj?.status).toBe('superseded');
        expect(oldFactObj?.supersededBy).toBe(newFact.id);
        expect(newFact.fact).toBe(newFactText);
        expect(memoryService.getActiveFacts(profileId).length).toBe(1);
    });

    it('generates a summary correctly', () => {
        memoryService.addFact(profileId, 'Strong at endgame', 'strength', 'test');
        memoryService.addFact(profileId, 'Forgets to castle', 'skill-gap', 'test');
        memoryService.addFact(profileId, 'Prefers visual hints', 'preference', 'test');

        const summary = memoryService.getStudentSummary(profileId);

        expect(summary.summary.recentStrengths).toContain('Strong at endgame');
        expect(summary.summary.recentGaps).toContain('Forgets to castle');
        expect(summary.summary.preferredHintStyle).toBe('visual');
    });

    it('generates context for AI prompt', () => {
        memoryService.addFact(profileId, 'Strong with Knights', 'strength', 'test');
        memoryService.addRule('Never call a piece "bad"');

        const context = memoryService.getContextForAI(profileId);

        expect(context).toContain('## Student Profile');
        expect(context).toContain('Strong with Knights');
        expect(context).toContain('Never call a piece "bad"');
    });

    it('handles fact decay (mocking time)', () => {
        vi.useFakeTimers();

        const fact = memoryService.addFact(profileId, 'Old fact', 'milestone', 'test');

        // Advance time by 40 days (Cold tier is > 30 days)
        const fortyDaysInMs = 40 * 24 * 60 * 60 * 1000;
        vi.advanceTimersByTime(fortyDaysInMs);

        // We need to update the lastAccessed manually or simulate the passage of time another way
        // since the service uses Date.now() internally at the time of check usually, 
        // but the daysSince function in memoryService.ts uses the fact.lastAccessed string.

        // Let's manually set the lastAccessed to 40 days ago
        const pastDate = new Date(Date.now() - fortyDaysInMs).toISOString();
        fact.lastAccessed = pastDate;

        const tieredFacts = memoryService.getTieredFacts(profileId);
        expect(tieredFacts[0].tier).toBe('cold');

        const hotWarm = memoryService.getHotAndWarmFacts(profileId);
        expect(hotWarm.length).toBe(0);

        vi.useRealTimers();
    });
});
