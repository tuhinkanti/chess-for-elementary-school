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
        (memoryService as any).store = (memoryService as any).createEmptyStore();
    });

    it('initializes with an empty store', async () => {
        const facts = await memoryService.getStudentFacts(profileId);
        expect(facts.profileId).toBe(profileId);
        expect(facts.facts).toEqual([]);
    });

    it('adds a fact correctly', async () => {
        const factText = 'Likes to use the Queen early';
        const category = 'preference';
        const source = 'tutor-observation';

        const fact = await memoryService.addFact(profileId, factText, category, source);

        expect(fact.fact).toBe(factText);
        expect(fact.category).toBe(category);
        expect(fact.accessCount).toBe(1);

        const activeFacts = await memoryService.getActiveFacts(profileId);
        expect(activeFacts.length).toBe(1);
        expect(activeFacts[0].id).toBe(fact.id);
    });

    it('accesses a fact and increments counter', async () => {
        const fact = await memoryService.addFact(profileId, 'Testing access', 'milestone', 'test');
        await memoryService.accessFact(profileId, fact.id);

        const facts = (await memoryService.getStudentFacts(profileId)).facts;
        const updatedFact = facts.find(f => f.id === fact.id);
        expect(updatedFact?.accessCount).toBe(2);
    });

    it('supersedes a fact correctly', async () => {
        const oldFact = await memoryService.addFact(profileId, 'Thinks pawns are weak', 'skill-gap', 'test');
        const newFactText = 'Learned that pawns are the soul of chess';

        const newFact = await memoryService.supersedeFact(profileId, oldFact.id, newFactText);

        const facts = (await memoryService.getStudentFacts(profileId)).facts;
        const oldFactObj = facts.find(f => f.id === oldFact.id);

        expect(oldFactObj?.status).toBe('superseded');
        expect(oldFactObj?.supersededBy).toBe(newFact.id);
        expect(newFact.fact).toBe(newFactText);
        expect((await memoryService.getActiveFacts(profileId)).length).toBe(1);
    });

    it('generates a summary correctly', async () => {
        await memoryService.addFact(profileId, 'Strong at endgame', 'strength', 'test');
        await memoryService.addFact(profileId, 'Forgets to castle', 'skill-gap', 'test');
        await memoryService.addFact(profileId, 'Prefers visual hints', 'preference', 'test');

        const summary = await memoryService.getStudentSummary(profileId);

        expect(summary.summary.recentStrengths).toContain('Strong at endgame');
        expect(summary.summary.recentGaps).toContain('Forgets to castle');
        expect(summary.summary.preferredHintStyle).toBe('visual');
    });

    it('generates context for AI prompt', async () => {
        await memoryService.addFact(profileId, 'Strong with Knights', 'strength', 'test');
        await memoryService.addRule('Never call a piece "bad"');

        const context = await memoryService.getContextForAI(profileId);

        expect(context).toContain('## Student Profile');
        expect(context).toContain('Strong with Knights');
        expect(context).toContain('Never call a piece "bad"');
    });

    it('handles fact decay (mocking time)', async () => {
        vi.useFakeTimers();

        const fact = await memoryService.addFact(profileId, 'Old fact', 'milestone', 'test');

        // Advance time by 40 days (Cold tier is > 30 days)
        const fortyDaysInMs = 40 * 24 * 60 * 60 * 1000;
        vi.advanceTimersByTime(fortyDaysInMs);

        // We need to update the lastAccessed manually or simulate the passage of time another way
        // since the service uses Date.now() internally at the time of check usually, 
        // but the daysSince function in memoryService.ts uses the fact.lastAccessed string.

        // Let's manually set the lastAccessed to 40 days ago
        const pastDate = new Date(Date.now() - fortyDaysInMs).toISOString();
        fact.lastAccessed = pastDate;

        const tieredFacts = await memoryService.getTieredFacts(profileId);
        expect(tieredFacts[0].tier).toBe('cold');

        const hotWarm = await memoryService.getHotAndWarmFacts(profileId);
        expect(hotWarm.length).toBe(0);

        vi.useRealTimers();
    });
});
