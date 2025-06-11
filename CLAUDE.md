# Twitter HP Monitor 拡張機能

## プロジェクト概要

情報リテラシー向上を目的としたChrome拡張機能。TwitterのポストをOpenAI APIで分析し、問題のある投稿（デマ、釣り記事）を読むとHPが減少するゲーミフィケーション機能を提供します。

## ファイル構成

```
/Users/naotookawa/Desktop/制作/HP/
├── manifest.json          # Chrome拡張機能の設定ファイル
├── content.js             # Twitter監視・DOM操作（メインロジック）
├── background.js          # OpenAI API通信処理
├── popup.html             # 設定画面のHTML
├── popup.js               # 設定画面のJavaScript
├── styles.css             # HPアイコンとUIのスタイル
├── icons/                 # アイコンファイル格納フォルダ
└── CLAUDE.md              # このファイル
```

## 主要機能

### 1. HPシステム
- **初期HP**: 100
- **HP減少ルール**: 信頼性スコア0-5に応じて0-5HP減少
- **表示**: ハートアイコン（❤️🖤）で視覚化

### 2. 投稿分析
- **対象**: Twitter/Xの全投稿
- **分析**: OpenAI API（GPT-3.5-turbo）による信頼性判定
- **タイミング**: リアルタイム（MutationObserver使用）

### 3. UI機能
- **HP表示**: 画面右上固定、レスポンシブ対応
- **分析結果**: ポップアップで表示（スコア・理由）
- **設定画面**: APIキー管理、HPリセット、テスト機能

## 技術仕様

### フロントエンド
- **DOM監視**: MutationObserver
- **ストレージ**: Chrome Storage API
- **スタイル**: CSS3（アニメーション、ダークモード対応）

### バックエンド
- **API**: OpenAI API (GPT-3.5-turbo)
- **通信**: Chrome Runtime Messaging
- **セキュリティ**: APIキー暗号化保存

### 投稿検出ロジック
```javascript
// 対応セレクタ
const tweetSelectors = [
    '[data-testid="tweet"]',
    '[data-testid="cellInnerDiv"] article', 
    'article[role="article"]'
];
```

## 開発・テスト手順

### 1. 初期設定
```bash
# 拡張機能を開発者モードでChromeに読み込み
1. chrome://extensions/ を開く
2. 「開発者モード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」で本フォルダを選択
```

### 2. APIキー設定
1. OpenAI APIキーを取得（https://platform.openai.com/api-keys）
2. 拡張機能のポップアップからAPIキーを入力・保存
3. 「分析テスト実行」で動作確認

### 3. 動作テスト
- Twitter/Xにアクセス
- 投稿が表示されると自動で分析開始
- HP表示の確認（右上のハートアイコン）
- 分析結果ポップアップの表示確認

### 4. デバッグ方法
```javascript
// Console出力確認
// content.js: F12 > Console
// background.js: chrome://extensions/ > 詳細 > バックグラウンドページ
```

## トラブルシューティング

### よくある問題

1. **HP表示が出ない**
   - ページリロード後数秒待つ
   - Consoleでエラー確認

2. **分析が動作しない**
   - APIキーの設定確認
   - ネットワーク接続確認
   - OpenAI APIの利用制限確認

3. **投稿が検出されない**
   - Twitterのページ構造変更の可能性
   - セレクタの更新が必要な場合あり

### エラー対処

```javascript
// 主なエラーパターン
- "OpenAI APIキーが設定されていません" → popup.htmlでAPIキー設定
- "API Error: insufficient_quota" → OpenAI APIの利用制限
- "JSON Parse Error" → OpenAI APIレスポンス形式の問題
```

## カスタマイズポイント

### HP減少量の調整
```javascript
// content.js:222
const hpLoss = Math.max(0, score); // 現在: スコア = HP減少量
```

### 分析プロンプトの調整
```javascript
// background.js:39-55
const prompt = `信頼性評価プロンプト...`;
```

### UI位置・デザイン変更
```css
/* styles.css:3-17 */
.hp-display {
    top: 20px;    /* 上からの距離 */
    right: 20px;  /* 右からの距離 */
}
```

## セキュリティ考慮事項

- ユーザーのAPIキーのみ使用（外部送信なし）
- 投稿内容は分析目的のみ（永続保存なし）
- Chrome Storage APIで暗号化保存
- Cross-origin制限によるセキュリティ確保

## 今後の拡張予定

- [ ] HP回復機能の実装
- [ ] 詳細統計画面の追加
- [ ] 複数SNSプラットフォーム対応
- [ ] カスタム分析ルール設定
- [ ] バッチ分析機能

## 関連リンク

- [Chrome拡張機能開発ガイド](https://developer.chrome.com/docs/extensions/)
- [OpenAI API ドキュメント](https://platform.openai.com/docs)
- [Twitter Web API](https://developer.twitter.com/en/docs)

## 開発履歴

- v1.0: 基本機能実装（HP監視、投稿分析、設定画面）
- 開発環境: Claude Sonnet 4
- 作成日: 2025年6月