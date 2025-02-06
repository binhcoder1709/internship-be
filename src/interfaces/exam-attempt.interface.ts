interface FinishExamData {
    attemptId: number;
    note?: string;
}

interface FinishExamResponse {
    attemptId: number;
    endTime: Date;
    completionRate: number;
    totalAnswered: number;
    correctAnswers: number;
    note?: string;
} 