# Werewolf Game App (人狼ゲーム)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.9.2-green.svg)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-3.8+-blue.svg)](https://www.docker.com/)

人狼ゲーム（Werewolf）のオンライン版アプリケーションです。リアルタイムチャット、WebSocket通信、複数の役職を備えた本格的な人狼ゲームを提供します。

## 🎮 ゲーム概要

### 基本ルール

- **プレイヤー数**: 5-20人
- **ゲーム時間**: 約15-30分
- **勝利条件**:
  - 村人チーム: 人狼を全て処刑する
  - 人狼チーム: 村人の数を人狼以下にする
  - 狐チーム: 特定の条件下で勝利

### 役職一覧

| 役職   | 陣営 | 能力 | 説明                            |
| ------ | ---- | ---- | ------------------------------- |
| 村人   | 村人 | なし | 投票で人狼を見つけ出す          |
| 占い師 | 村人 | 占い | 夜に1人を選んで人狼かどうか判定 |
| 霊能者 | 村人 | 霊能 | 処刑された人の陣営を確認        |
| 狩人   | 村人 | 護衛 | 夜に1人を護衛して襲撃を防ぐ     |
| 人狼   | 人狼 | 襲撃 | 夜に1人を襲撃して殺害           |
| 狂人   | 人狼 | なし | 人狼の味方だが能力はない        |
| 共鳴者 | 村人 | なし | 他の共鳴者と互いを認識          |
| 狐     | 狐   | 特殊 | 独自の勝利条件を持つ            |

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MongoDB       │
│   (React + Vite)│◄──►│   (Node.js +    │◄──►│   (Database)    │
│   Port: 4173    │    │    Express)     │    │   Port: 27017   │
│                 │    │   Port: 3000    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx         │
                    │   (Reverse      │
                    │    Proxy)       │
                    │   Port: 80/443  │
                    └─────────────────┘
```

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- Docker & Docker Compose
- MongoDB（Dockerで自動起動）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd werewolf_app
```

### 2. 環境変数の設定

```bash
# デプロイ用の環境変数ファイルをコピー
cp deploy/env.example deploy/.env

# 環境変数を編集
nano deploy/.env
```

### 3. Docker Composeで起動

```bash
# すべてのサービスを起動
docker-compose -f deploy/docker-compose.werewolf.yml up -d --build

# ログを確認
docker-compose -f deploy/docker-compose.werewolf.yml logs -f
```

### 4. アプリケーションにアクセス

- フロントエンド: http://localhost
- バックエンドAPI: http://localhost/api

## 🛠️ 開発環境セットアップ

### バックエンド開発

```bash
cd backend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# テストの実行
npm test

# ビルド
npm run build
```

### フロントエンド開発

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# ビルド
npm run build
```

## 📁 プロジェクト構造

```
werewolf_app/
├── backend/                 # バックエンド (Node.js + TypeScript)
│   ├── src/
│   │   ├── classes/        # ゲームロジッククラス
│   │   ├── config/         # 設定ファイル
│   │   ├── controllers/    # APIコントローラー
│   │   ├── middleware/     # ミドルウェア
│   │   ├── models/         # MongoDBモデル
│   │   ├── routes/         # APIルート
│   │   ├── socketHandlers/ # WebSocketハンドラー
│   │   └── utils/          # ユーティリティ
│   ├── __tests__/          # テストファイル
│   └── package.json
├── frontend/               # フロントエンド (React + Vite)
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── pages/          # ページコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── context/        # React Context
│   │   └── reducers/       # 状態管理
│   └── package.json
├── deploy/                 # デプロイ設定
│   ├── docker-compose.werewolf.yml
│   ├── env.example
│   └── README.werewolf.md
├── mongodb/                # MongoDB設定
├── nginx/                  # Nginx設定
└── README.md
```

## 🔧 主要機能

### 認証システム

- JWT認証
- メール認証
- ゲストログイン
- パスワードリセット

### チャンネル機能

- チャンネル作成・管理
- パスワード保護
- ゲスト入室制限
- リアルタイムチャット

### ゲーム機能

- リアルタイムゲーム進行
- 複数役職対応
- 投票システム
- 夜の行動（占い、襲撃、護衛）
- ゲーム結果管理

### 管理機能

- ユーザー管理
- ブロック機能
- 観戦機能
- 投票履歴

## 🌐 API エンドポイント

### 認証

- `POST /api/user/register` - ユーザー登録
- `POST /api/user/login` - ログイン
- `POST /api/user/logout` - ログアウト

### チャンネル

- `GET /api/channel` - チャンネル一覧
- `POST /api/channel` - チャンネル作成
- `POST /api/channel/:id/join` - チャンネル入室

### ゲーム

- `POST /api/game/start` - ゲーム開始
- `POST /api/game/:id/vote` - 投票
- `GET /api/game/:id/status` - ゲーム状態

### メッセージ

- `GET /api/message/:channelId` - メッセージ取得
- `POST /api/message` - メッセージ送信

## 🔒 環境変数

### 必須設定

```bash
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_APP_USERNAME=werewolf_user
MONGO_APP_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_long_jwt_secret_key

# Email (ユーザー登録用)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Server
SERVER_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### オプション設定

```bash
# AWS S3 (画像アップロード用)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name

# SSL/Let's Encrypt
DOMAIN_NAME=your-domain.com
CERTBOT_EMAIL=your-email@domain.com
```

## 🧪 テスト

### バックエンドテスト

```bash
cd backend
npm test
npm run test:coverage
```

### フロントエンドテスト

```bash
cd frontend
npm test
```

## 🚀 デプロイ

### Docker Compose デプロイ

```bash
# 本番環境用
docker-compose -f deploy/docker-compose.werewolf.yml up -d --build

# SSL証明書の設定
cd nginx
./ssl-setup.sh setup
```

### 手動デプロイ

```bash
# バックエンド
cd backend
npm run build
pm2 start dist/app.js --name werewolf-backend

# フロントエンド
cd frontend
npm run build:production
# ビルドファイルをWebサーバーに配置
```

## 🔧 トラブルシューティング

### よくある問題

#### MongoDB接続エラー

```bash
# MongoDBの状態確認
docker-compose -f deploy/docker-compose.werewolf.yml exec mongodb mongosh --eval "db.adminCommand('ping')"
```

#### WebSocket接続エラー

- ファイアウォール設定を確認
- CORS設定を確認
- SSL証明書の有効性を確認

#### メール送信エラー

- Gmailのアプリパスワード設定を確認
- 環境変数の設定を確認

## 📝 ライセンス

このプロジェクトは ISC ライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesページで報告してください。

## 🔄 更新履歴

- **v1.0.0** - 初期リリース
  - 基本的な人狼ゲーム機能
  - リアルタイムチャット
  - 複数役職対応
  - Docker環境対応

---

**注意**: このアプリケーションは教育・娯楽目的で作成されています。本格的な商用利用の場合は、セキュリティとパフォーマンスの追加検証が必要です。
