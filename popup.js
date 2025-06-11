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
        } catch (error) {
            console.error('HP読み込みエラー:', error);
            this.currentHP = 100;
        }
    }

    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['openaiApiKey']);
            if (result.openaiApiKey) {
                document.getElementById('apiKey').value = result.openaiApiKey;
            }
        } catch (error) {
            console.error('APIキー読み込みエラー:', error);
        }
    }

    updateHPDisplay() {
        const hpHearts = document.getElementById('hpHearts');
        const hpText = document.getElementById('hpText');
        
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
        if (this.currentHP <= 20) {
            hpStatus.style.background = 'rgba(255, 71, 87, 0.3)';
        } else if (this.currentHP <= 50) {
            hpStatus.style.background = 'rgba(255, 193, 7, 0.3)';
        } else {
            hpStatus.style.background = 'rgba(255, 255, 255, 0.1)';
        }
    }

    setupEventListeners() {
        // APIキー保存
        document.getElementById('saveApiKey').addEventListener('click', () => {
            this.saveApiKey();
        });

        // HPリセット
        document.getElementById('resetHP').addEventListener('click', () => {
            this.resetHP();
        });

        // 分析テスト
        document.getElementById('testAnalysis').addEventListener('click', () => {
            this.testAnalysis();
        });

        // EnterキーでAPIキー保存
        document.getElementById('apiKey').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
    }

    async saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const statusElement = document.getElementById('apiKeyStatus');
        
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
        } catch (error) {
            console.error('APIキー保存エラー:', error);
            this.showStatus(statusElement, '保存に失敗しました', 'error');
        }
    }

    async resetHP() {
        const statusElement = document.getElementById('actionStatus');
        
        try {
            this.currentHP = 100;
            await chrome.storage.local.set({ currentHP: 100 });
            this.updateHPDisplay();
            this.showStatus(statusElement, 'HPを100にリセットしました', 'success');
            
            // コンテンツスクリプトにも反映
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
                chrome.tabs.sendMessage(tab.id, { action: 'updateHP', hp: 100 });
            }
        } catch (error) {
            console.error('HPリセットエラー:', error);
            this.showStatus(statusElement, 'リセットに失敗しました', 'error');
        }
    }

    async testAnalysis() {
        const statusElement = document.getElementById('actionStatus');
        
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
            
            if (response && response.success) {
                const { score, reason } = response.data;
                this.showStatus(statusElement, 
                    `テスト完了: スコア${score}, ${reason}`, 'success');
            } else {
                this.showStatus(statusElement, 
                    `テスト失敗: ${response?.error || '不明なエラー'}`, 'error');
            }
        } catch (error) {
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
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});