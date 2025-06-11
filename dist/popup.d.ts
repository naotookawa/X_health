interface AnalysisResponse {
    success: boolean;
    data?: {
        score: number;
        reason: string;
    };
    error?: string;
}
declare class PopupManager {
    private currentHP;
    constructor();
    init(): Promise<void>;
    loadCurrentHP(): Promise<void>;
    loadApiKey(): Promise<void>;
    updateHPDisplay(): void;
    setupEventListeners(): void;
    saveApiKey(): Promise<void>;
    deleteApiKey(): Promise<void>;
    resetHP(): Promise<void>;
    testAnalysis(): Promise<void>;
    showStatus(element: HTMLElement, message: string, type: 'success' | 'error'): void;
    showCustomConfirm(message: string): Promise<boolean>;
}
//# sourceMappingURL=popup.d.ts.map