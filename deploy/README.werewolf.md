# Werewolf App - Complete Docker Setup

このディレクトリには、Werewolfアプリケーションの完全なDocker環境が含まれています。MongoDB、Backend、Frontend、Nginx、Let's Encrypt SSL証明書を含む統合されたセットアップです。

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MongoDB       │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Database)    │
│   Port: 4173    │    │   Port: 3000    │    │   Port: 27017   │
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
                                 │
                    ┌─────────────────┐
                    │   Let's Encrypt │
                    │   (SSL Certs)   │
                    └─────────────────┘
```

## 📁 ファイル構成

```
deploy/
├── docker-compose.werewolf.yml  # 統合されたDocker Compose設定
├── env.example                  # 環境変数テンプレート
└── README.werewolf.md          # このファイル

nginx/
├── nginx-ssl.conf              # Let's Encrypt対応nginx設定
├── ssl-setup.sh                # SSL証明書設定スクリプト
└── ...                         # その他のnginx設定ファイル
```

## 🚀 クイックスタート

### 1. 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp env.example .env

# .envファイルを編集して適切な値を設定
nano .env
```

### 2. アプリケーションの起動

```bash
# すべてのサービスをビルドして起動
docker-compose -f docker-compose.werewolf.yml up -d --build

# ログを確認
docker-compose -f docker-compose.werewolf.yml logs -f
```

### 3. SSL証明書の設定（本番環境）

```bash
# nginxディレクトリに移動
cd ../nginx

# SSL証明書を取得
./ssl-setup.sh setup

# 証明書の状態を確認
./ssl-setup.sh status
```

## ⚙️ 詳細設定

### 環境変数

#### MongoDB設定

```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_mongo_root_password
MONGO_APP_USERNAME=werewolf_user
MONGO_APP_PASSWORD=your_secure_mongo_app_password
```

#### バックエンド設定

```bash
NODE_ENV=production
JWT_SECRET=your_very_long_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

#### フロントエンド設定

```bash
VITE_API_URL=https://your-domain.com/api
VITE_SOCKET_URL=wss://your-domain.com
```

#### SSL設定

```bash
DOMAIN_NAME=your-domain.com
CERTBOT_EMAIL=your-email@your-domain.com
```

### サービス管理

#### サービスの起動

```bash
# すべてのサービス
docker-compose -f docker-compose.werewolf.yml up -d

# 特定のサービス
docker-compose -f docker-compose.werewolf.yml up -d mongodb
docker-compose -f docker-compose.werewolf.yml up -d backend
docker-compose -f docker-compose.werewolf.yml up -d frontend
docker-compose -f docker-compose.werewolf.yml up -d nginx
```

#### サービスの停止

```bash
# すべてのサービス
docker-compose -f docker-compose.werewolf.yml down

# ボリュームも削除
docker-compose -f docker-compose.werewolf.yml down -v
```

#### ログの確認

```bash
# すべてのログ
docker-compose -f docker-compose.werewolf.yml logs -f

# 特定のサービスのログ
docker-compose -f docker-compose.werewolf.yml logs -f backend
docker-compose -f docker-compose.werewolf.yml logs -f nginx
```

## 🔒 SSL証明書管理

### 初期設定

```bash
# SSL証明書を取得
./ssl-setup.sh setup
```

### 証明書の更新

```bash
# 手動更新
./ssl-setup.sh renew

# 自動更新（cronに追加）
0 12 * * * /path/to/nginx/ssl-setup.sh renew
```

### 証明書の確認

```bash
# 証明書の状態確認
./ssl-setup.sh status

# 証明書の詳細確認
./ssl-setup.sh check
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. MongoDB接続エラー

```bash
# MongoDBの状態確認
docker-compose -f docker-compose.werewolf.yml exec mongodb mongosh --eval "db.adminCommand('ping')"

# ログ確認
docker-compose -f docker-compose.werewolf.yml logs mongodb
```

#### 2. バックエンド起動エラー

```bash
# バックエンドの状態確認
docker-compose -f docker-compose.werewolf.yml exec backend curl -f http://localhost:3000/health

# ログ確認
docker-compose -f docker-compose.werewolf.yml logs backend
```

#### 3. SSL証明書エラー

```bash
# 証明書の有効性確認
docker-compose -f docker-compose.werewolf.yml exec nginx openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout

# nginx設定の構文チェック
docker-compose -f docker-compose.werewolf.yml exec nginx nginx -t
```

#### 4. フロントエンドビルドエラー

```bash
# フロントエンドのビルドログ確認
docker-compose -f docker-compose.werewolf.yml logs frontend

# 手動でビルド
docker-compose -f docker-compose.werewolf.yml build frontend
```

### ログファイルの場所

```bash
# Nginxログ
docker-compose -f docker-compose.werewolf.yml exec nginx tail -f /var/log/nginx/werewolf-app.access.log
docker-compose -f docker-compose.werewolf.yml exec nginx tail -f /var/log/nginx/werewolf-app.error.log

# バックエンドログ
docker-compose -f docker-compose.werewolf.yml exec backend tail -f /app/logs/app.log
```

## 📊 監視とヘルスチェック

### ヘルスチェックエンドポイント

- **Nginx**: `http://localhost/health`
- **Backend**: `http://localhost:3000/health`
- **Frontend**: `http://localhost:4173`

### サービス状態確認

```bash
# すべてのサービスの状態確認
docker-compose -f docker-compose.werewolf.yml ps

# ヘルスチェック結果確認
docker-compose -f docker-compose.werewolf.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
```

## 🔄 更新とデプロイ

### アプリケーションの更新

```bash
# 最新のコードを取得
git pull

# イメージを再ビルド
docker-compose -f docker-compose.werewolf.yml build

# サービスを再起動
docker-compose -f docker-compose.werewolf.yml up -d
```

### データベースのバックアップ

```bash
# MongoDBのバックアップ
docker-compose -f docker-compose.werewolf.yml exec mongodb mongodump --out /data/backup

# バックアップファイルをホストにコピー
docker cp werewolf-mongodb:/data/backup ./backup
```

## 🛡️ セキュリティ

### 推奨事項

1. **強力なパスワード**: すべてのパスワードを強力なものに変更
2. **ファイアウォール**: ポート80、443のみを開放
3. **定期的な更新**: セキュリティパッチを定期的に適用
4. **ログ監視**: アクセスログを定期的に確認
5. **バックアップ**: データベースを定期的にバックアップ

### 本番環境での注意点

- 環境変数ファイル（.env）をGitにコミットしない
- SSL証明書の自動更新を設定
- ログローテーションを設定
- リソース制限を設定

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. ログファイルの確認
2. 環境変数の設定
3. ネットワーク接続の確認
4. ディスク容量の確認

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
