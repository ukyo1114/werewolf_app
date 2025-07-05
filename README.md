# Werewolf App

人狼ゲームのWebアプリケーション

## プロジェクト構造

```
werewolf_app/
├── backend/                # サーバーアプリ（Node.js + TypeScript）
│   ├── src/               # ソースコード
│   ├── __tests__/         # テストファイル
│   ├── package.json       # 依存関係
│   └── Dockerfile         # バックエンド用Dockerfile
├── frontend/              # フロントエンド（React）
│   ├── src/               # ソースコード
│   ├── public/            # 静的ファイル
│   ├── package.json       # 依存関係
│   └── Dockerfile         # フロントエンド用Dockerfile
├── deploy/                # デプロイ関連
│   ├── docker-compose.yml # Docker Compose設定
│   ├── nginx/             # nginx設定
│   └── scripts/           # デプロイスクリプト
└── README.md              # このファイル
```

## 開発環境のセットアップ

### バックエンド開発

```bash
cd backend
npm install
npm run dev
```

### フロントエンド開発

```bash
cd frontend
npm install
npm start
```

## Docker環境での実行

```bash
cd deploy
docker-compose up -d
```

## テスト実行

### バックエンドテスト

```bash
cd backend
npm test
```

### フロントエンドテスト

```bash
cd frontend
npm test
```

## デプロイ

詳細は `deploy/README.md` を参照してください。

## 技術スタック

- **バックエンド**: Node.js, TypeScript, Express, Socket.io, MongoDB
- **フロントエンド**: React, TypeScript
- **インフラ**: Docker, nginx, AWS EC2
- **CI/CD**: GitHub Actions
