# 🛡️ 我々は詭弁を滅さんとす！Chrome Extension

## 📖 概要

情報リテラシー向上を目的としたChrome拡張機能です。TwitterのポストをAI（OpenAI GPT-3.5-turbo）で分析し、問題のある投稿（デマ、釣り記事など）を読むとHPが減少するゲーミフィケーション機能を提供します。

## ✨ 主な機能

### 🎮 ゲームシステム
- **HP システム**: 初期HP100から開始、問題投稿でHPが減少
- **ゲームオーバー**: HP 0で警告表示＋自動回復
- **低HP警告**: HP 20以下でハートアイコンが点滅
- **ダメージエフェクト**: HP減少時のシェイクアニメーション

### 🤖 AI分析
- **リアルタイム分析**: OpenAI APIによる投稿の信頼性自動判定
- **高精度判定**: ユーモア・ジョークを除外した誤判定防止
- **詳細結果**: 信頼性スコア（0-5）と判定理由を表示

### 🎨 UI/UX
- **レスポンシブHP表示**: 画面右上の視覚的ハートアイコン（クリックで設定画面）
- **ポップアップスタック**: 最大10個まで重ねて表示
- **クリック操作**: ポップアップをクリックで閉じる
- **ウェルカム画面**: 初回起動時の親切なAPIキー設定ガイド
- **APIキー管理**: 保存・削除機能（カスタム確認ダイアログ付き）
- **美しいホバー効果**: 全ボタンに浮遊感とグロー効果

## 🚀 インストール方法

### 📋 前提条件
- Google Chrome ブラウザ
- OpenAI API キー（[こちら](https://platform.openai.com/api-keys)で取得）
- Node.js（開発時のみ）

### 🔧 手順

1. **プロジェクトのセットアップ**
   ```bash
   # 依存関係のインストール
   npm install
   
   # TypeScriptのコンパイル
   npm run build
   ```

2. **拡張機能の読み込み**
   ```
   1. Chrome で chrome://extensions/ を開く
   2. 右上の「開発者モード」を有効化
   3. 「パッケージ化されていない拡張機能を読み込む」をクリック
   4. このプロジェクトのフォルダを選択
   ```

3. **APIキーの設定**
   - 初回起動時に自動表示されるウェルカム画面の指示に従う
   - または拡張機能アイコンから手動で設定
   - 「分析テスト実行」で動作確認

## 🎯 使用方法

1. **Twitter/X にアクセス** - 拡張機能が自動で起動します
2. **HP確認** - 右上のハートアイコンで現在のHP状況を確認
3. **自動分析** - 投稿が表示されると自動でAI分析が開始
4. **結果確認** - 問題のある投稿で分析結果ポップアップが表示
5. **ポップアップ操作** - クリックで個別に閉じたり、自動でスタック管理

### 🎮 ゲーム要素
- **HP減少**: 信頼性スコア1-5に応じてHP減少
- **低HP警告**: HP 20以下でハートが点滅
- **ゲームオーバー**: HP 0で警告＋100に自動回復
- **詭弁検出**: 「詭弁を見つけたり！！: Lv.X」で表示

## 📁 ファイル構成

```
├── manifest.json          # Chrome拡張機能の設定
├── src/                   # TypeScriptソースファイル
│   ├── content.ts         # Twitter監視・DOM操作（メインロジック）
│   ├── background.ts      # OpenAI API通信処理
│   └── popup.ts           # 設定画面のJavaScript
├── dist/                  # コンパイル済みJavaScript
│   ├── content.js
│   ├── background.js
│   └── popup.js
├── popup.html             # 設定画面のHTML
├── styles.css             # UIスタイル（ウェルカム画面含む）
├── icons/                 # アイコンファイル
├── tsconfig.json          # TypeScript設定
├── package.json           # npm設定
└── README.md              # このファイル
```

## ⚙️ 技術仕様

- **言語**: TypeScript（型安全性向上）
- **フロントエンド**: HTML5, CSS3
- **API**: OpenAI GPT-3.5-turbo
- **ストレージ**: Chrome Storage API
- **DOM監視**: MutationObserver
- **エラーハンドリング**: 拡張機能コンテキスト無効化対応

## 🔧 トラブルシューティング

### よくある問題

| 問題 | 解決方法 |
|------|----------|
| **HP表示が出ない** | ページリロード後数秒待つ / 拡張機能を再読み込み |
| **分析が動作しない** | ウェルカム画面または設定画面でAPIキー設定 |
| **投稿が検出されない** | Twitterの構造変更の可能性（アップデート待ち）|
| **ポップアップが点滅** | 修正済み（ハート部分のみアニメーション）|
| **拡張機能エラー** | 警告表示後、ページを再読み込み |
| **APIキー削除したい** | 設定画面の赤い「API キーを削除」ボタン |

### 🛠️ 開発者向け

```bash
# TypeScript開発時
npm run build  # コンパイル

# デバッグ
# content.ts: F12 > Console
# background.ts: chrome://extensions/ > 詳細 > バックグラウンドページ
```

## 📚 詳細ドキュメント

詳細な開発情報、カスタマイズ方法、技術仕様については [CLAUDE.md](./CLAUDE.md) をご参照ください。

## 🔒 セキュリティ

- ✅ ユーザーのAPIキーのみ使用（外部送信なし）
- ✅ 投稿内容は分析目的のみ（永続保存なし）
- ✅ Chrome Storage APIで暗号化保存
- ✅ Cross-origin制限によるセキュリティ確保

## 🚀 今後の予定

- [ ] HP回復機能（良質な投稿でHP回復）
- [ ] 詳細統計画面（分析履歴・傾向）
- [ ] 複数SNSプラットフォーム対応
- [ ] ダークモード対応
- [ ] 多言語対応

## 📄 ライセンス

MIT License

## ⚠️ 注意事項

- この拡張機能は教育・研究目的で作成されました
- OpenAI APIの利用にはコストが発生する場合があります
- Twitter/Xの構造変更により動作しなくなる可能性があります

## 🎯 開発者

- **作成**: Claude Sonnet 4
- **言語**: TypeScript, HTML, CSS
- **バージョン**: v1.3 (2025年6月)

---

© 2025 東京大學詭弁論部

📱 **Twitter/Xでより賢く、より安全にブラウジングしましょう！**