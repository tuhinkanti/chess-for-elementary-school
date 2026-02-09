import { useCallback, useMemo } from 'react';
import { memoryService } from '../services/memory/memoryService';
import type { AtomicFact, FactCategory, StudentSummary, TieredFact, SessionEntry } from '../services/memory/memoryTypes';

interface UseStudentMemoryReturn {
    // Facts
    getActiveFacts: () => Promise<AtomicFact[]>;
    getHotAndWarmFacts: () => Promise<TieredFact[]>;
    addFact: (fact: string, category: FactCategory, source: string) => Promise<AtomicFact>;
    accessFact: (factId: string) => Promise<void>;

    // Summary
    getSummary: () => Promise<StudentSummary>;
    regenerateSummary: () => Promise<StudentSummary>;

    // Sessions
    startSession: (lessonId: number) => Promise<SessionEntry>;
    endSession: () => Promise<void>;
    recordObjectiveCompleted: (objectiveId: string) => Promise<void>;
    recordTutorInteraction: (type: 'arrow' | 'highlight' | 'message', context: string, response: string) => Promise<void>;

    // AI Context
    getContextForAI: () => Promise<string>;
}

export function useStudentMemory(profileId: string | undefined): UseStudentMemoryReturn {
    const safeProfileId = profileId || 'anonymous';

    const getActiveFacts = useCallback(async () => {
        return memoryService.getActiveFacts(safeProfileId);
    }, [safeProfileId]);

    const getHotAndWarmFacts = useCallback(async () => {
        return memoryService.getHotAndWarmFacts(safeProfileId);
    }, [safeProfileId]);

    const addFact = useCallback(async (fact: string, category: FactCategory, source: string) => {
        return memoryService.addFact(safeProfileId, fact, category, source);
    }, [safeProfileId]);

    const accessFact = useCallback(async (factId: string) => {
        await memoryService.accessFact(safeProfileId, factId);
    }, [safeProfileId]);

    const getSummary = useCallback(async () => {
        return memoryService.getStudentSummary(safeProfileId);
    }, [safeProfileId]);

    const regenerateSummary = useCallback(async () => {
        return memoryService.regenerateSummary(safeProfileId);
    }, [safeProfileId]);

    const startSession = useCallback(async (lessonId: number) => {
        return memoryService.startSession(safeProfileId, lessonId);
    }, [safeProfileId]);

    const endSession = useCallback(async () => {
        await memoryService.endSession(safeProfileId);
    }, [safeProfileId]);

    const recordObjectiveCompleted = useCallback(async (objectiveId: string) => {
        await memoryService.recordObjectiveCompleted(safeProfileId, objectiveId);
    }, [safeProfileId]);

    const recordTutorInteraction = useCallback(async (
        type: 'arrow' | 'highlight' | 'message',
        context: string,
        response: string
    ) => {
        await memoryService.recordTutorInteraction(safeProfileId, type, context, response);
    }, [safeProfileId]);

    const getContextForAI = useCallback(async () => {
        return memoryService.getContextForAI(safeProfileId);
    }, [safeProfileId]);

    return useMemo(() => ({
        getActiveFacts,
        getHotAndWarmFacts,
        addFact,
        accessFact,
        getSummary,
        regenerateSummary,
        startSession,
        endSession,
        recordObjectiveCompleted,
        recordTutorInteraction,
        getContextForAI,
    }), [
        getActiveFacts,
        getHotAndWarmFacts,
        addFact,
        accessFact,
        getSummary,
        regenerateSummary,
        startSession,
        endSession,
        recordObjectiveCompleted,
        recordTutorInteraction,
        getContextForAI,
    ]);
}
