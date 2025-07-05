# プロジェクト構造

```
werewolf-app/
├── backend/                    # バックエンド（Node.js）
│   ├── Dockerfile.backend
│   ├── package.json
│   ├── src/
│   └── ...
├── frontend/                   # フロントエンド（React）
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   └── ...
├── nginx/                      # リバースプロキシ
│   ├── Dockerfile.nginx
│   ├── nginx.conf
│   └── ssl/
├── docker-compose.yml          # 統合設定
├── .env                        # 環境変数
├── logs/                       # ログディレクトリ
│   ├── backend/
│   ├── frontend/
│   └── nginx/
└── mongo-init/                 # MongoDB初期化スクリプト
```

## 各サービスの役割

### 🗄️ **MongoDB**

- データベース
- データの永続化
- 認証・認可

### 🔧 **Backend**

- APIサーバー
- ビジネスロジック
- WebSocket接続

### 🎨 **Frontend**

- Reactアプリケーション
- ユーザーインターフェース
- 静的ファイル配信

### 🌐 **Nginx**

- リバースプロキシ
- SSL終端
- ロードバランサー
- 静的ファイル配信
