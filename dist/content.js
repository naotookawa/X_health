"use strict";
// Twitter HP Monitor - Content Script
class TwitterHPMonitor {
    constructor() {
        this.currentHP = 100;
        this.processedTweets = new Set();
        this.hpDisplay = null;
        this.resultPopup = null;
        this.popupStack = [];
        this.isExtensionValid = true;
        this.isGameOver = false;
        this.init();
    }
    async init() {
        // HPを読み込み
        await this.loadHP();
        // HP表示を作成
        this.createHPDisplay();
        // 初回起動チェック
        await this.checkFirstRun();
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
    async checkFirstRun() {
        try {
            const result = await chrome.storage.local.get(['firstRunCompleted', 'openaiApiKey']);
            // 初回起動またはAPIキー未設定の場合
            if (!result.firstRunCompleted || !result.openaiApiKey) {
                this.showWelcomePopup();
            }
        }
        catch (error) {
            console.error('初回起動チェックエラー:', error);
            // エラーの場合は安全のためウェルカム画面を表示
            this.showWelcomePopup();
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
        // ハートクリックで拡張機能ポップアップを開く
        this.setupHeartClickEvent();
        this.updateHPDisplay();
    }
    setupHeartClickEvent() {
        if (!this.hpDisplay)
            return;
        const heartsContainer = this.hpDisplay.querySelector('.hearts-container');
        if (!heartsContainer)
            return;
        // 既存のイベントリスナーがあるかチェック
        if (heartsContainer.dataset.clickHandlerAdded === 'true') {
            return;
        }
        // ハートコンテナにクリックイベントを追加
        heartsContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 拡張機能のポップアップを開く
            chrome.runtime.sendMessage({ action: 'openPopup' }).catch(error => {
                console.error('ポップアップを開けませんでした:', error);
            });
        });
        // ホバー効果のためのカーソルスタイル追加
        heartsContainer.style.cursor = 'pointer';
        heartsContainer.title = 'クリックして設定画面を開く';
        // イベントハンドラー追加済みフラグを設定
        heartsContainer.dataset.clickHandlerAdded = 'true';
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
        // ハートクリックイベントを再設定（DOM更新後）
        this.setupHeartClickEvent();
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
        // 拡張機能が無効化されている場合は処理をスキップ
        if (!this.isExtensionValid) {
            return;
        }
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Extension context invalidated') ||
                errorMessage.includes('Receiving end does not exist')) {
                console.warn('拡張機能のコンテキストが無効化されました。ページを再読み込みしてください。');
                this.isExtensionValid = false;
                this.showExtensionInvalidatedMessage();
                return;
            }
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
            this.showResult(score, reason, hpLoss, tweetText);
            // HPが0になった場合の処理（ゲームオーバー状態でない場合のみ）
            if (this.currentHP <= 0 && !this.isGameOver) {
                this.handleGameOver();
            }
        }
    }
    showResult(score, reason, hpLoss, tweetText) {
        if (!this.hpDisplay)
            return;
        // ツイートテキストを適切な長さに制限
        const truncatedTweet = tweetText.length > 100 ?
            tweetText.substring(0, 100) + '...' :
            tweetText;
        // 新しいpopupを作成
        const newPopup = document.createElement('div');
        newPopup.className = 'result-popup';
        newPopup.innerHTML = `
      <div class="result-content">
        <div class="tweet-content">「${truncatedTweet}」</div>
        <div class="score">詭弁を見つけたり！！: Lv.${score}</div>
        <div class="hp-loss">HP -${hpLoss}</div>
        <div class="reason">${reason}</div>
      </div>
    `;
        // スタック内の位置を計算して配置
        this.positionPopupInStack(newPopup);
        // HP表示要素に追加
        this.hpDisplay.appendChild(newPopup);
        // スタックに追加
        this.popupStack.push(newPopup);
        // クリックで閉じる機能を追加
        newPopup.onclick = () => {
            this.removePopupFromStack(newPopup);
        };
        // 最大10個までに制限（古いものから削除）
        if (this.popupStack.length > 10) {
            const oldestPopup = this.popupStack.shift();
            if (oldestPopup && oldestPopup.parentNode) {
                oldestPopup.parentNode.removeChild(oldestPopup);
            }
            this.repositionAllPopups();
        }
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
    positionPopupInStack(popup) {
        const stackIndex = this.popupStack.length;
        const topOffset = 100 + (stackIndex * 10); // 最初のpopupから10pxずつ下にずらす
        popup.style.position = 'absolute';
        popup.style.top = `${topOffset}%`;
        popup.style.right = '0';
        popup.style.marginTop = '10px';
        popup.style.zIndex = (1000 + stackIndex).toString();
    }
    removePopupFromStack(popup) {
        const index = this.popupStack.indexOf(popup);
        if (index > -1) {
            this.popupStack.splice(index, 1);
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
            this.repositionAllPopups();
        }
    }
    repositionAllPopups() {
        this.popupStack.forEach((popup, index) => {
            const topOffset = 100 + (index * 10);
            popup.style.top = `${topOffset}%`;
            popup.style.zIndex = (1000 + index).toString();
        });
    }
    showExtensionInvalidatedMessage() {
        if (!this.resultPopup)
            return;
        this.resultPopup.innerHTML = `
      <div class="result-content extension-invalidated">
        <div class="warning">⚠️ 拡張機能のコンテキストが無効化されました</div>
        <div class="instruction">ページを再読み込みしてください</div>
      </div>
    `;
        this.resultPopup.style.display = 'block';
        // 10秒後に非表示
        setTimeout(() => {
            if (this.resultPopup) {
                this.resultPopup.style.display = 'none';
            }
        }, 10000);
    }
    async handleGameOver() {
        // ゲームオーバー状態に設定
        this.isGameOver = true;
        // 警告メッセージを表示
        alert('⚠️ HPが0になりました。\n一旦Xから離れたまえ！\n\n情報リテラシーを向上させて、\nより健全な情報を摂取しましょう。\n\n© 2025 東京大學詭弁論部');
        // OKを押した後にHPを100にリセット
        this.currentHP = 100;
        await this.saveHP();
        this.updateHPDisplay();
        // ゲームオーバー状態を解除
        this.isGameOver = false;
        console.log('ゲームオーバー処理が実行されました');
    }
    showWelcomePopup() {
        // オーバーレイを作成
        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        // ウェルカムpopupを作成
        const welcomePopup = document.createElement('div');
        welcomePopup.className = 'welcome-popup';
        welcomePopup.innerHTML = `
      <div class="welcome-content">
        <div class="welcome-header">
          <h2>🛡️ 我々は詭弁を滅さんとす！</h2>
        </div>
        <div class="welcome-body">
          <p>情報リテラシー向上のためのChrome拡張機能です。</p>
          <p>デマや有害な投稿を読むとHPが減少し、注意を促します。</p>
          
          <div class="setup-section">
            <h3>📋 初期設定が必要です</h3>
            <ol>
              <li><strong>OpenAI APIキー</strong>の取得が必要です</li>
              <li><a href="https://platform.openai.com/api-keys" target="_blank">OpenAI公式サイト</a> でアカウント作成</li>
              <li>APIキーを生成してコピー</li>
              <li>下のボタンから設定画面を開いてAPIキーを入力</li>
            </ol>
          </div>
          
          <div class="welcome-note">
            <p><strong>注意:</strong> APIキーはあなたのブラウザにのみ保存され、外部に送信されません。</p>
          </div>
        </div>
        <div class="welcome-actions">
          <button class="btn-primary" id="openSettings">設定画面を開く</button>
          <button class="btn-secondary" id="closeWelcome">後で設定する</button>
        </div>
        <div class="welcome-footer">
          <p>© 2025 東京大學詭弁論部</p>
        </div>
      </div>
    `;
        overlay.appendChild(welcomePopup);
        document.body.appendChild(overlay);
        // ボタンイベントを設定
        this.setupWelcomeEvents(overlay);
    }
    setupWelcomeEvents(overlay) {
        const openSettingsBtn = overlay.querySelector('#openSettings');
        const closeWelcomeBtn = overlay.querySelector('#closeWelcome');
        openSettingsBtn?.addEventListener('click', () => {
            // 拡張機能の設定画面を開く
            chrome.runtime.sendMessage({ action: 'openPopup' });
            this.closeWelcomePopup(overlay);
        });
        closeWelcomeBtn?.addEventListener('click', () => {
            this.closeWelcomePopup(overlay);
        });
        // オーバーレイクリックで閉じる
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeWelcomePopup(overlay);
            }
        });
    }
    async closeWelcomePopup(overlay) {
        // フェードアウトアニメーション
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
        // 初回起動完了フラグを保存
        try {
            await chrome.storage.local.set({ firstRunCompleted: true });
        }
        catch (error) {
            console.error('初回起動フラグ保存エラー:', error);
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