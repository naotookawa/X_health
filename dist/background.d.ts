interface AnalysisRequest {
    action: string;
    text: string;
}
interface AnalysisResult {
    score: number;
    reason: string;
}
interface OpenAIResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}
interface OpenAIErrorResponse {
    error?: {
        message?: string;
    };
}
declare class BackgroundService {
    constructor();
    setupMessageListener(): void;
    getOpenAIKey(): Promise<string>;
    analyzeTweetWithOpenAI(tweetText: string): Promise<AnalysisResult>;
}
//# sourceMappingURL=background.d.ts.map