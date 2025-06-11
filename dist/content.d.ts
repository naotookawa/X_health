interface AnalysisResult {
    score: number;
    reason: string;
}
interface AnalysisResponse {
    success: boolean;
    data?: AnalysisResult;
    error?: string;
}
declare class TwitterHPMonitor {
    private currentHP;
    private processedTweets;
    private hpDisplay;
    private resultPopup;
    constructor();
    init(): Promise<void>;
    loadHP(): Promise<void>;
    saveHP(): Promise<void>;
    createHPDisplay(): void;
    updateHPDisplay(): void;
    observeTwitter(): void;
    processVisibleTweets(): void;
    processNewTweets(node: Element): void;
    processTweet(tweetElement: Element): void;
    getTweetId(tweetElement: Element): string;
    extractTweetText(tweetElement: Element): string;
    analyzeTweet(tweetText: string, tweetElement: Element): Promise<void>;
    handleAnalysisResult(analysisData: AnalysisResult, tweetText: string): Promise<void>;
    showResult(score: number, reason: string, hpLoss: number): void;
}
//# sourceMappingURL=content.d.ts.map