import { useCallback, useMemo } from 'react';
import { memoryService } from '../services/memory/memoryService';
import type { AtomicFact, FactCategory, StudentSummary, TieredFact } from '../services/memory/memoryTypes';

interface UseStudentMemoryReturn {
    // Facts
    getActiveFacts: () => AtomicFact[];
    getHotAndWarmFacts: () => TieredFact[];
    addFact: (fact: string, category: FactCategory, source: string, relatedEntities?: string[]) => AtomicFact;
    accessFact: (factId: string) => void;

    // Summary
    getSummary: () => StudentSummary;
    regenerateSummary: () => StudentSummary;

    // Sessions
    startSession: (lessonId: number) => void;
    endSession: () => void;
    recordObjectiveCompleted: (objectiveId: string) => void;
    recordTutorInteraction: (type: 'arrow' | 'highlight' | 'message', context: string, response: string) => void;

    // AI Context
    getContextForAI: () => string;
}

export function useStudentMemory(profileId: string | undefined): UseStudentMemoryReturn {
    const safeProfileId = profileId || 'anonymous';

    const getActiveFacts = useCallback(() => {
        return memoryService.getActiveFacts(safeProfileId);
    }, [safeProfileId]);

    const getHotAndWarmFacts = useCallback(() => {
        return memoryService.getHotAndWarmFacts(safeProfileId);
    }, [safeProfileId]);

    const addFact = useCallback((fact: string, category: FactCategory, source: string, relatedEntities: string[] = []) => {
        return memoryService.addFact(safeProfileId, fact, category, source, relatedEntities);
    }, [safeProfileId]);

    const accessFact = useCallback((factId: string) => {
        memoryService.accessFact(safeProfileId, factId);
    }, [safeProfileId]);

    const getSummary = useCallback(() => {
        return memoryService.getStudentSummary(safeProfileId);
    }, [safeProfileId]);

    const regenerateSummary = useCallback(() => {
        return memoryService.regenerateSummary(safeProfileId);
    }, [safeProfileId]);

    const startSession = useCallback((lessonId: number) => {
        memoryService.startSession(safeProfileId, lessonId);
    }, [safeProfileId]);

    const endSession = useCallback(() => {
        memoryService.endSession(safeProfileId);
    }, [safeProfileId]);

    const recordObjectiveCompleted = useCallback((objectiveId: string) => {
        memoryService.recordObjectiveCompleted(safeProfileId, objectiveId);
    }, [safeProfileId]);

    const recordTutorInteraction = useCallback((
        type: 'arrow' | 'highlight' | 'message',
        context: string,
        response: string
    ) => {
        memoryService.recordTutorInteraction(safeProfileId, type, context, response);
    }, [safeProfileId]);

    const getContextForAI = useCallback(() => {
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
