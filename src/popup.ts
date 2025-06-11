// Twitter HP Monitor - Popup Script

interface AnalysisResponse {
  success: boolean;
  data?: {
    score: number;
    reason: string;
  };
  error?: string;
}

class PopupManager {
  private currentHP: number = 100;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    await this.loadCurrentHP();
    await this.loadApiKey();
    this.updateHPDisplay();
    this.setupEventListeners();
  }

  async loadCurrentHP(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['currentHP']);
      this.currentHP = result.currentHP !== undefined ? result.currentHP : 100;
    } catch (error) {
      console.error('HP読み込みエラー:', error);
      this.currentHP = 100;
    }
  }

  async loadApiKey(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['openaiApiKey']);
      const apiKeyElement = document.getElementById('apiKey') as HTMLInputElement;
      if (result.openaiApiKey && apiKeyElement) {
        apiKeyElement.value = result.openaiApiKey;
      }
    } catch (error) {
      console.error('APIキー読み込みエラー:', error);
    }
  }

  updateHPDisplay(): void {
    const hpHearts = document.getElementById('hpHearts');
    const hpText = document.getElementById('hpText');
    
    if (!hpHearts || !hpText) return;
    
    // ハートの表示を更新
    let heartsHTML = '';
    for (let i = 0; i < 10; i++) {
      heartsHTML += (i * 10) < this.currentHP ? '❤️' : '🖤';
    }
    hpHearts.innerHTML = heartsHTML;
    
    // HP数値を更新
    hpText.textContent = `HP: ${this.currentHP}/100`;
    
    // HP状態に応じてスタイル変更
    const hpStatus = document.querySelector('.hp-status') as HTMLElement;
    if (hpStatus) {
      if (this.currentHP <= 20) {
        hpStatus.style.background = 'rgba(255, 71, 87, 0.3)';
      } else if (this.currentHP <= 50) {
        hpStatus.style.background = 'rgba(255, 193, 7, 0.3)';
      } else {
        hpStatus.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    }
  }

  setupEventListeners(): void {
    // APIキー保存
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    saveApiKeyBtn?.addEventListener('click', () => {
      this.saveApiKey();
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
    apiKeyInput?.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.saveApiKey();
      }
    });
  }

  async saveApiKey(): Promise<void> {
    const apiKeyElement = document.getElementById('apiKey') as HTMLInputElement;
    const statusElement = document.getElementById('apiKeyStatus');
    
    if (!apiKeyElement || !statusElement) return;
    
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
    } catch (error) {
      console.error('APIキー保存エラー:', error);
      this.showStatus(statusElement, '保存に失敗しました', 'error');
    }
  }

  async resetHP(): Promise<void> {
    const statusElement = document.getElementById('actionStatus');
    if (!statusElement) return;
    
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
    } catch (error) {
      console.error('HPリセットエラー:', error);
      this.showStatus(statusElement, 'リセットに失敗しました', 'error');
    }
  }

  async testAnalysis(): Promise<void> {
    const statusElement = document.getElementById('actionStatus');
    if (!statusElement) return;
    
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
      }) as AnalysisResponse;
      
      if (response?.success && response.data) {
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

  showStatus(element: HTMLElement, message: string, type: 'success' | 'error'): void {
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