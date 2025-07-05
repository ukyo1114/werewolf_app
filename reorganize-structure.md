# プロジェクト再構成計画

## 現在の構造

```
werewolf_app/
├── src/                    # サーバーアプリ（バックエンド）
├── frontend/               # フロントエンド（React）
├── deploy/                 # デプロイ関連
├── docker-compose.yml      # Docker設定
├── Dockerfile.*           # Docker設定
└── その他の設定ファイル
```

## 新しい構造（推奨）

```
werewolf_app/
├── backend/                # サーバーアプリ（バックエンド）
│   ├── src/
│   ├── __tests__/
│   ├── __mocks__/
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── Dockerfile
├── frontend/               # フロントエンド（React）
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── deploy/                 # デプロイ関連
│   ├── docker-compose.yml
│   ├── nginx/
│   └── scripts/
├── docs/                   # ドキュメント
└── README.md
```

## 分離のメリット

1. **責任の分離**: バックエンドとフロントエンドが明確に分離
2. **独立した開発**: 各サービスを独立して開発・デプロイ可能
3. **チーム開発**: フロントエンドとバックエンドチームが独立して作業
4. **スケーラビリティ**: 各サービスを個別にスケール可能
