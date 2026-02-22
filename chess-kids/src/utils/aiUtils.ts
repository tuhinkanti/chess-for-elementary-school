export interface GameContext {
    fen: string;
    lastMove?: string; // PGN notation or UCI
    lessonObjective?: string;
    studentContext?: string; // Memory-based context about the student
}

export function constructSystemPrompt(context?: GameContext): string {
    const studentInfo = context?.studentContext
        ? `\n## What You Know About This Student\n${context.studentContext}\n`
        : '';

    const boardInfo = context?.fen
        ? `\nCurrent Board (FEN): ${context.fen}\nLast Move: ${context.lastMove || "None"}`
        : '';

    return `
You are Grandmaster Gloop, a friendly, magical chess tutor for a 7-year-old.
${studentInfo}
Goal: Help the student with their current lesson in a fun, encouraging way.
Objective: ${context?.lessonObjective || "Play a good move"}
${boardInfo}

Instructions:
1. Be encouraging, concise, and use simple words.
2. If the user made a mistake, explain WHY plainly (no complex notation).
3. Reference what you know about the student's strengths and struggles if relevant.
4. Keep responses SHORT - 1-3 sentences max for young learners.
5. Identify NEW facts about the student based on this interaction (e.g., "Student struggles with knights", "Student likes visual hints") and include them in 'learnedFacts'.
6. Always respond with valid JSON.

Response format:
{
  "message": string (your friendly response),
  "mood": "encouraging" | "thinking" | "surprised" | "celebrating",
  "highlightSquare": string (optional),
  "drawArrow": string (optional "e2-e4"),
  "learnedFacts": string[] (optional list of new observations)
}
    `.trim();
}

export function extractJson(text: string): unknown {
    if (!text || typeof text !== 'string') {
        return null;
    }

    try {
        // 1. Try direct parsing
        return JSON.parse(text);
    } catch {
        // 2. Try parsing a JSON code block (```json ... ```)
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            try {
                return JSON.parse(codeBlockMatch[1]);
            } catch {
                // Continue if code block parse fails
            }
        }

        // 3. Try finding the first '{' and last '}'
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose > firstOpen) {
            const potentialJson = text.substring(firstOpen, lastClose + 1);
            try {
                return JSON.parse(potentialJson);
            } catch {
                return null;
            }
        }

        return null;
    }
}

export function validateTutorRequest(body: unknown): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Invalid request body' };
    }

    // Check if messages exists and is an array
    // We cast to any for check, or use type guard
    const b = body as Record<string, unknown>;

    if (!('messages' in b)) {
        return { valid: false, error: 'Messages are required' };
    }

    if (!Array.isArray(b.messages)) {
         return { valid: false, error: 'Messages must be an array' };
    }

    if (b.messages.length === 0) {
        return { valid: false, error: 'Messages cannot be empty' };
    }

    return { valid: true };
}
