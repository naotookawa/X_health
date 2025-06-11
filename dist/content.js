"use strict";
// Twitter HP Monitor - Content Script
class TwitterHPMonitor {
    constructor() {
        this.currentHP = 100;
        this.processedTweets = new Set();
        this.hpDisplay = null;
        this.resultPopup = null;
        this.init();
    }
    async init() {
        // HPを読み込み
        await this.loadHP();
        // HP表示を作成
        this.createHPDisplay();
        // 既存のツイートを処理
        this.processVisibleTweets();
        // DOM変更を監視
        this.observeTwitter();
        console.log('Twitter HP Monitor initialized');
    }
    async loadHP() {
        try {
            const result = await chrome.storage.local.get(['currentHP']);
            this.currentHP = result.currentHP !== undefined ? result.currentHP : 100;
        }
        catch (error) {
            console.error('HP読み込みエラー:', error);
            this.currentHP = 100;
        }
    }
    async saveHP() {
        try {
            await chrome.storage.local.set({ currentHP: this.currentHP });
        }
        catch (error) {
            console.error('HP保存エラー:', error);
        }
    }
    createHPDisplay() {
        // HP表示コンテナ
        this.hpDisplay = document.createElement('div');
        this.hpDisplay.id = 'twitter-hp-monitor';
        this.hpDisplay.className = 'hp-display';
        // HP hearts container
        const heartsContainer = document.createElement('div');
        heartsContainer.className = 'hearts-container';
        this.hpDisplay.appendChild(heartsContainer);
        // 結果ポップアップ
        this.resultPopup = document.createElement('div');
        this.resultPopup.className = 'result-popup';
        this.resultPopup.style.display = 'none';
        this.hpDisplay.appendChild(this.resultPopup);
        document.body.appendChild(this.hpDisplay);
        this.updateHPDisplay();
    }
    updateHPDisplay() {
        if (!this.hpDisplay)
            return;
        const heartsContainer = this.hpDisplay.querySelector('.hearts-container');
        if (!heartsContainer)
            return;
        // ハートを更新
        heartsContainer.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            heart.textContent = (i * 10) < this.currentHP ? '❤️' : '🖤';
            heartsContainer.appendChild(heart);
        }
        // HPが低い場合の警告
        if (this.currentHP <= 20) {
            this.hpDisplay.classList.add('low-hp');
        }
        else {
            this.hpDisplay.classList.remove('low-hp');
        }
    }
    observeTwitter() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.processNewTweets(node);
                        }
                    });
                }
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    processVisibleTweets() {
        // Twitterの投稿を検索（複数のセレクタパターンに対応）
        const tweetSelectors = [
            '[data-testid="tweet"]',
            '[data-testid="cellInnerDiv"] article',
            'article[role="article"]'
        ];
        let tweets = null;
        for (const selector of tweetSelectors) {
            tweets = document.querySelectorAll(selector);
            if (tweets.length > 0)
                break;
        }
        if (tweets) {
            tweets.forEach(tweet => this.processTweet(tweet));
        }
    }
    processNewTweets(node) {
        // 新しく追加されたツイートを検索
        const tweetSelectors = [
            '[data-testid="tweet"]',
            '[data-testid="cellInnerDiv"] article',
            'article[role="article"]'
        ];
        for (const selector of tweetSelectors) {
            const tweets = node.querySelectorAll(selector);
            tweets.forEach(tweet => this.processTweet(tweet));
            // node自体がツイートの場合
            if (node.matches?.(selector)) {
                this.processTweet(node);
            }
        }
    }
    processTweet(tweetElement) {
        // 既に処理済みかチェック
        const tweetId = this.getTweetId(tweetElement);
        if (this.processedTweets.has(tweetId)) {
            return;
        }
        this.processedTweets.add(tweetId);
        // ツイート内容を抽出
        const tweetText = this.extractTweetText(tweetElement);
        if (!tweetText || tweetText.trim().length === 0) {
            return;
        }
        // 分析を依頼
        this.analyzeTweet(tweetText, tweetElement);
    }
    getTweetId(tweetElement) {
        // ツイートの一意IDを生成（位置とテキストのハッシュ）
        const text = this.extractTweetText(tweetElement);
        // 日本語対応のハッシュ生成
        let hash = 0;
        const str = text.substring(0, 100);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit整数に変換
        }
        return Math.abs(hash).toString(36);
    }
    extractTweetText(tweetElement) {
        // ツイートテキストを抽出（複数のパターンに対応）
        const textSelectors = [
            '[data-testid="tweetText"]',
            '[lang] span',
            '.tweet-text',
            'div[dir="auto"]'
        ];
        for (const selector of textSelectors) {
            const textElements = tweetElement.querySelectorAll(selector);
            if (textElements.length > 0) {
                return Array.from(textElements)
                    .map(el => el.textContent)
                    .join(' ')
                    .trim();
            }
        }
        // fallback: 全テキストを取得
        return tweetElement.textContent?.trim() || '';
    }
    async analyzeTweet(tweetText, tweetElement) {
        try {
            // バックグラウンドスクリプトに分析を依頼
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeTweet',
                text: tweetText
            });
            if (response?.success && response.data) {
                await this.handleAnalysisResult(response.data, tweetText);
            }
        }
        catch (error) {
            console.error('ツイート分析エラー:', error);
        }
    }
    async handleAnalysisResult(analysisData, tweetText) {
        const { score, reason } = analysisData;
        // HPを減少
        const hpLoss = Math.max(0, score); // スコア1-5 = HP減少1-5
        if (hpLoss > 0) {
            this.currentHP = Math.max(0, this.currentHP - hpLoss);
            await this.saveHP();
            this.updateHPDisplay();
            // 結果をポップアップで表示
            this.showResult(score, reason, hpLoss);
        }
    }
    showResult(score, reason, hpLoss) {
        if (!this.resultPopup)
            return;
        this.resultPopup.innerHTML = `
      <div class="result-content">
        <div class="score">信頼性スコア: ${score}/5</div>
        <div class="hp-loss">HP -${hpLoss}</div>
        <div class="reason">${reason}</div>
      </div>
    `;
        this.resultPopup.style.display = 'block';
        // 3秒後に非表示
        setTimeout(() => {
            if (this.resultPopup) {
                this.resultPopup.style.display = 'none';
            }
        }, 3000);
        // HP減少アニメーション
        if (this.hpDisplay) {
            this.hpDisplay.classList.add('hp-damage');
            setTimeout(() => {
                if (this.hpDisplay) {
                    this.hpDisplay.classList.remove('hp-damage');
                }
            }, 500);
        }
    }
}
// 初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TwitterHPMonitor();
    });
}
else {
    new TwitterHPMonitor();
}
//# sourceMappingURL=content.js.map