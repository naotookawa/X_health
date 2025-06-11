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
    private popupStack;
    private isExtensionValid;
    private isGameOver;
    constructor();
    init(): Promise<void>;
    loadHP(): Promise<void>;
    saveHP(): Promise<void>;
    checkFirstRun(): Promise<void>;
    createHPDisplay(): void;
    setupHeartClickEvent(): void;
    updateHPDisplay(): void;
    observeTwitter(): void;
    processVisibleTweets(): void;
    processNewTweets(node: Element): void;
    processTweet(tweetElement: Element): void;
    getTweetId(tweetElement: Element): string;
    extractTweetText(tweetElement: Element): string;
    analyzeTweet(tweetText: string, tweetElement: Element): Promise<void>;
    handleAnalysisResult(analysisData: AnalysisResult, tweetText: string): Promise<void>;
    showResult(score: number, reason: string, hpLoss: number, tweetText: string): void;
    positionPopupInStack(popup: HTMLElement): void;
    removePopupFromStack(popup: HTMLElement): void;
    repositionAllPopups(): void;
    showExtensionInvalidatedMessage(): void;
    handleGameOver(): Promise<void>;
    showWelcomePopup(): void;
    setupWelcomeEvents(overlay: HTMLElement): void;
    closeWelcomePopup(overlay: HTMLElement): Promise<void>;
}
//# sourceMappingURL=content.d.ts.map