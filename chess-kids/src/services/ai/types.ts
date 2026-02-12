export interface TutorResponse {
    message: string;
    mood: "encouraging" | "thinking" | "surprised" | "celebrating";
    highlightSquare?: string;
    drawArrow?: string; // Format: "e2-e4"
    learnedFacts?: string[]; // New facts learned about the student
}

export interface GameContext {
    fen: string;
    lastMove?: string; // PGN notation or UCI
    lessonObjective?: string;
    studentContext?: string; // Memory-based context about the student
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
