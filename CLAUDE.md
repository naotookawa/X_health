# 我々は詭弁を滅さんとす！拡張機能

## プロジェクト概要

情報リテラシー向上を目的としたChrome拡張機能。TwitterのポストをOpenAI APIで分析し、問題のある投稿（デマ、釣り記事）を読むとHPが減少するゲーミフィケーション機能を提供します。

## ファイル構成

```
/Users/naotookawa/Desktop/制作/HP/
├── manifest.json          # Chrome拡張機能の設定ファイル
├── src/                   # TypeScriptソースファイル
│   ├── content.ts         # Twitter監視・DOM操作（メインロジック）
│   ├── background.ts      # OpenAI API通信処理
│   └── popup.ts           # 設定画面のJavaScript
├── dist/                  # コンパイル済みJavaScriptファイル
│   ├── content.js
│   ├── background.js
│   └── popup.js
├── popup.html             # 設定画面のHTML
├── styles.css             # HPアイコンとUIのスタイル
├── icons/                 # アイコンファイル格納フォルダ
├── tsconfig.json          # TypeScript設定ファイル
├── package.json           # npm設定ファイル
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
- **HP表示**: 画面右上固定、レスポンシブ対応（クリックで設定画面）
- **分析結果**: ポップアップで表示（スコア・理由・ツイート内容）
- **ポップアップスタック**: 最大10個まで重ねて表示、クリックで閉じる
- **設定画面**: APIキー管理（保存・削除）、HPリセット、テスト機能
- **ウェルカム画面**: 初回起動時のAPIキー設定ガイダンス
- **カスタムダイアログ**: Chrome拡張機能対応の美しい確認ダイアログ

### 4. ゲーム要素
- **HP 0 システム**: HPが0になると警告表示＋自動回復
- **低HP警告**: HP 20以下でハートアイコンが点滅
- **ダメージエフェクト**: HP減少時にシェイクアニメーション

## 技術仕様

### フロントエンド
- **言語**: TypeScript（型安全性とコード品質向上）
- **DOM監視**: MutationObserver
- **ストレージ**: Chrome Storage API
- **スタイル**: CSS3（アニメーション、レスポンシブ対応）
- **エラーハンドリング**: 拡張機能コンテキスト無効化対応

### バックエンド
- **API**: OpenAI API (GPT-3.5-turbo)
- **通信**: Chrome Runtime Messaging
- **セキュリティ**: APIキー暗号化保存
- **プロンプト**: ユーモア・ジョーク除外の高精度分析

### 投稿検出ロジック
```typescript
// 対応セレクタ
const tweetSelectors = [
    '[data-testid="tweet"]',
    '[data-testid="cellInnerDiv"] article', 
    'article[role="article"]'
];
```

### UI表示システム
```typescript
// ポップアップスタック管理
positionPopupInStack(popup: HTMLElement): void {
  const stackIndex = this.popupStack.length;
  const topOffset = 100 + (stackIndex * 10);
  popup.style.top = `${topOffset}%`;
  popup.style.zIndex = (1000 + stackIndex).toString();
}
```

## 開発・テスト手順

### 1. 環境構築
```bash
# 依存関係インストール
npm install

# TypeScriptコンパイル
npm run build
```

### 2. 拡張機能インストール
```bash
# 拡張機能を開発者モードでChromeに読み込み
1. chrome://extensions/ を開く
2. 「開発者モード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」で本フォルダを選択
```

### 3. APIキー設定
1. 初回起動時に自動表示されるウェルカム画面の指示に従う
2. または拡張機能のポップアップからAPIキーを手動入力
3. OpenAI APIキーを取得（https://platform.openai.com/api-keys）
4. 「分析テスト実行」で動作確認

### 4. 動作テスト
- Twitter/Xにアクセス
- 投稿が表示されると自動で分析開始
- HP表示の確認（右上のハートアイコン）
- 分析結果ポップアップの表示確認（クリックで閉じる）
- ポップアップスタック機能の確認

### 5. デバッグ方法
```bash
# TypeScript開発時
npm run build  # コンパイル

# Console出力確認
# content.ts: F12 > Console
# background.ts: chrome://extensions/ > 詳細 > バックグラウンドページ
```

## トラブルシューティング

### よくある問題

1. **HP表示が出ない**
   - ページリロード後数秒待つ
   - Consoleでエラー確認
   - 拡張機能の再読み込み

2. **分析が動作しない**
   - ウェルカム画面の指示に従ってAPIキー設定
   - ネットワーク接続確認
   - OpenAI APIの利用制限確認

3. **投稿が検出されない**
   - Twitterのページ構造変更の可能性
   - セレクタの更新が必要な場合あり

4. **ポップアップが点滅する**
   - CSS設定でハート部分のみアニメーション対象に修正済み

5. **拡張機能コンテキスト無効化**
   - 警告メッセージが表示された場合、ページ再読み込み

### エラー対処

```typescript
// 主なエラーパターン
- "OpenAI APIキーが設定されていません" → ウェルカム画面または設定画面でAPIキー設定
- "API Error: insufficient_quota" → OpenAI APIの利用制限
- "JSON Parse Error" → OpenAI APIレスポンス形式の問題
- "Extension context invalidated" → 拡張機能再読み込み後ページリロード
```

## カスタマイズポイント

### HP減少量の調整
```typescript
// src/content.ts:271
const hpLoss = Math.max(0, score); // 現在: スコア = HP減少量
```

### ポップアップ表示数の調整
```typescript
// src/content.ts:322
if (this.popupStack.length > 10) { // 最大表示数変更
```

### 分析プロンプトの調整
```typescript
// src/background.ts:64-91
const prompt = `ユーモア・ジョーク除外の高精度分析プロンプト...`;
```

### UI位置・デザイン変更
```css
/* styles.css:3-17 */
.hp-display {
    top: 20px;    /* 上からの距離 */
    right: 20px;  /* 右からの距離 */
}
```

### ウェルカム画面のカスタマイズ
```css
/* styles.css:151-318 */
.welcome-overlay { /* ウェルカム画面のデザイン */ }
```

## セキュリティ考慮事項

- ユーザーのAPIキーのみ使用（外部送信なし）
- 投稿内容は分析目的のみ（永続保存なし）
- Chrome Storage APIで暗号化保存
- Cross-origin制限によるセキュリティ確保

## 機能追加履歴

- [x] 拡張機能コンテキスト無効化エラー対応
- [x] HP 0 ゲームオーバー機能（アラート表示＋自動回復）
- [x] ポップアップ内容改善（ツイート内容表示）
- [x] クリックで閉じるポップアップ機能
- [x] ポップアップスタック機能（最大10個）
- [x] AI分析プロンプト改善（ユーモア・ジョーク除外）
- [x] ポップアップ点滅問題修正
- [x] 初回起動ウェルカム画面実装
- [x] TypeScript移行（型安全性向上）
- [x] ハートクリックで設定画面アクセス機能
- [x] APIキー削除機能（カスタム確認ダイアログ）
- [x] 全ボタンのホバー効果改善（浮遊感・グロー効果）
- [x] アプリ名変更「我々は詭弁を滅さんとす！」
- [x] 東京大學詭弁論部クレジット追加

## 今後の拡張予定

- [ ] HP回復機能の実装
- [ ] 詳細統計画面の追加
- [ ] 複数SNSプラットフォーム対応
- [ ] カスタム分析ルール設定
- [ ] バッチ分析機能
- [ ] ダークモード対応
- [ ] 多言語対応

## 関連リンク

- [Chrome拡張機能開発ガイド](https://developer.chrome.com/docs/extensions/)
- [OpenAI API ドキュメント](https://platform.openai.com/docs)
- [Twitter Web API](https://developer.twitter.com/en/docs)

## 開発履歴

### v1.0 (2025年6月)
- 基本機能実装（HP監視、投稿分析、設定画面）

### v1.1 (2025年6月)  
- 拡張機能エラーハンドリング強化
- HP 0 ゲームオーバー機能追加
- UI/UX大幅改善（ポップアップスタック、クリック操作）

### v1.2 (2025年6月)
- AI分析精度向上（ユーモア・ジョーク誤判定防止）
- 初回起動UX改善（ウェルカム画面）
- TypeScript移行完了

### v1.3 (2025年6月)
- ハートクリック機能追加（設定画面への直接アクセス）
- APIキー削除機能実装（カスタム確認ダイアログ）
- 全ボタンのホバー効果改善（浮遊感・グロー・パルス）
- アプリ名変更「我々は詭弁を滅さんとす！」
- 東京大學詭弁論部クレジット追加

## 開発情報
- **開発環境**: Claude Sonnet 4
- **プログラミング言語**: TypeScript, HTML, CSS
- **フレームワーク**: Chrome Extensions API
- **AI API**: OpenAI GPT-3.5-turbo