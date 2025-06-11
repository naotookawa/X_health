"use strict";
// Twitter HP Monitor - Popup Script
class PopupManager {
    constructor() {
        this.currentHP = 100;
        this.init();
    }
    async init() {
        await this.loadCurrentHP();
        await this.loadApiKey();
        this.updateHPDisplay();
        this.setupEventListeners();
    }
    async loadCurrentHP() {
        try {
            const result = await chrome.storage.local.get(['currentHP']);
            this.currentHP = result.currentHP !== undefined ? result.currentHP : 100;
        }
        catch (error) {
            console.error('HP読み込みエラー:', error);
            this.currentHP = 100;
        }
    }
    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['openaiApiKey']);
            const apiKeyElement = document.getElementById('apiKey');
            if (result.openaiApiKey && apiKeyElement) {
                apiKeyElement.value = result.openaiApiKey;
            }
        }
        catch (error) {
            console.error('APIキー読み込みエラー:', error);
        }
    }
    updateHPDisplay() {
        const hpHearts = document.getElementById('hpHearts');
        const hpText = document.getElementById('hpText');
        if (!hpHearts || !hpText)
            return;
        // ハートの表示を更新
        let heartsHTML = '';
        for (let i = 0; i < 10; i++) {
            heartsHTML += (i * 10) < this.currentHP ? '❤️' : '🖤';
        }
        hpHearts.innerHTML = heartsHTML;
        // HP数値を更新
        hpText.textContent = `HP: ${this.currentHP}/100`;
        // HP状態に応じてスタイル変更
        const hpStatus = document.querySelector('.hp-status');
        if (hpStatus) {
            if (this.currentHP <= 20) {
                hpStatus.style.background = 'rgba(255, 71, 87, 0.3)';
            }
            else if (this.currentHP <= 50) {
                hpStatus.style.background = 'rgba(255, 193, 7, 0.3)';
            }
            else {
                hpStatus.style.background = 'rgba(255, 255, 255, 0.1)';
            }
        }
    }
    setupEventListeners() {
        // APIキー保存
        const saveApiKeyBtn = document.getElementById('saveApiKey');
        saveApiKeyBtn?.addEventListener('click', () => {
            this.saveApiKey();
        });
        // APIキー削除
        const deleteApiKeyBtn = document.getElementById('deleteApiKey');
        deleteApiKeyBtn?.addEventListener('click', () => {
            this.deleteApiKey();
        });
        // HPリセット
        const resetHPBtn = document.getElementById('resetHP');
        resetHPBtn?.addEventListener('click', () => {
            this.resetHP();
        });
        // 分析テスト
        const testAnalysisBtn = document.getElementById('testAnalysis');
        testAnalysisBtn?.addEventListener('click', () => {
            this.testAnalysis();
        });
        // EnterキーでAPIキー保存
        const apiKeyInput = document.getElementById('apiKey');
        apiKeyInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
    }
    async saveApiKey() {
        const apiKeyElement = document.getElementById('apiKey');
        const statusElement = document.getElementById('apiKeyStatus');
        if (!apiKeyElement || !statusElement)
            return;
        const apiKey = apiKeyElement.value.trim();
        if (!apiKey) {
            this.showStatus(statusElement, 'APIキーを入力してください', 'error');
            return;
        }
        if (!apiKey.startsWith('sk-')) {
            this.showStatus(statusElement, '有効なOpenAI APIキーを入力してください', 'error');
            return;
        }
        try {
            await chrome.storage.local.set({ openaiApiKey: apiKey });
            this.showStatus(statusElement, 'APIキーが保存されました', 'success');
        }
        catch (error) {
            console.error('APIキー保存エラー:', error);
            this.showStatus(statusElement, '保存に失敗しました', 'error');
        }
    }
    async deleteApiKey() {
        console.log('deleteApiKey called');
        const apiKeyElement = document.getElementById('apiKey');
        const statusElement = document.getElementById('apiKeyStatus');
        console.log('Elements found:', { apiKeyElement, statusElement });
        if (!apiKeyElement || !statusElement) {
            console.error('Elements not found!');
            return;
        }
        // 確認ダイアログ（カスタム実装）
        console.log('Showing custom confirm dialog');
        const confirmed = await this.showCustomConfirm('APIキーを削除しますか？\n削除すると分析機能が使用できなくなります。');
        console.log('Confirm result:', confirmed);
        if (!confirmed) {
            console.log('User cancelled deletion');
            return;
        }
        try {
            console.log('Attempting to delete API key');
            // ストレージからAPIキーを削除
            await chrome.storage.local.remove(['openaiApiKey']);
            // 入力フィールドもクリア
            apiKeyElement.value = '';
            console.log('Showing success message');
            this.showStatus(statusElement, 'APIキーが削除されました', 'success');
        }
        catch (error) {
            console.error('APIキー削除エラー:', error);
            this.showStatus(statusElement, '削除に失敗しました', 'error');
        }
    }
    async resetHP() {
        const statusElement = document.getElementById('actionStatus');
        if (!statusElement)
            return;
        try {
            this.currentHP = 100;
            await chrome.storage.local.set({ currentHP: 100 });
            this.updateHPDisplay();
            this.showStatus(statusElement, 'HPを100にリセットしました', 'success');
            // コンテンツスクリプトにも反映
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id && tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
                chrome.tabs.sendMessage(tab.id, { action: 'updateHP', hp: 100 });
            }
        }
        catch (error) {
            console.error('HPリセットエラー:', error);
            this.showStatus(statusElement, 'リセットに失敗しました', 'error');
        }
    }
    async testAnalysis() {
        const statusElement = document.getElementById('actionStatus');
        if (!statusElement)
            return;
        try {
            const result = await chrome.storage.local.get(['openaiApiKey']);
            if (!result.openaiApiKey) {
                this.showStatus(statusElement, '先にAPIキーを設定してください', 'error');
                return;
            }
            this.showStatus(statusElement, '分析テストを実行中...', 'success');
            // テスト用のツイートテキスト
            const testTweet = "今日は良い天気ですね。散歩日和です。";
            // バックグラウンドスクリプトでテスト分析
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeTweet',
                text: testTweet
            });
            if (response?.success && response.data) {
                const { score, reason } = response.data;
                this.showStatus(statusElement, `テスト完了: スコア${score}, ${reason}`, 'success');
            }
            else {
                this.showStatus(statusElement, `テスト失敗: ${response?.error || '不明なエラー'}`, 'error');
            }
        }
        catch (error) {
            console.error('分析テストエラー:', error);
            this.showStatus(statusElement, 'テストに失敗しました', 'error');
        }
    }
    showStatus(element, message, type) {
        element.textContent = message;
        element.className = `status-message status-${type}`;
        element.style.display = 'block';
        // 3秒後に非表示
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
    async showCustomConfirm(message) {
        return new Promise((resolve) => {
            // オーバーレイを作成
            const overlay = document.createElement('div');
            overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
      `;
            // ダイアログを作成
            const dialog = document.createElement('div');
            dialog.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 300px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      `;
            dialog.innerHTML = `
        <div style="margin-bottom: 20px; font-size: 16px; color: #333; line-height: 1.4;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="confirmOk" style="
            padding: 10px 20px;
            background: #ff4757;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          ">削除</button>
          <button id="confirmCancel" style="
            padding: 10px 20px;
            background: #f8f9fa;
            color: #333;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            cursor: pointer;
          ">キャンセル</button>
        </div>
      `;
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            // ボタンイベント
            const okBtn = dialog.querySelector('#confirmOk');
            const cancelBtn = dialog.querySelector('#confirmCancel');
            const cleanup = () => {
                document.body.removeChild(overlay);
            };
            okBtn?.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            cancelBtn?.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            // オーバーレイクリックでキャンセル
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }
}
// 初期化
console.log('Popup script loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    new PopupManager();
});
// 念のため、すぐにも初期化を試行
if (document.readyState === 'loading') {
    console.log('Document is still loading, waiting for DOMContentLoaded');
}
else {
    console.log('Document already loaded, initializing immediately');
    new PopupManager();
}
//# sourceMappingURL=popup.js.map