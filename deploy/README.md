# werewolfアプリ EC2デプロイガイド

## 概要

このガイドでは、werewolfアプリをAWS EC2で本番環境にデプロイする手順を説明します。

## 前提条件

- AWS EC2インスタンス（Amazon Linux 2）
- ドメイン名（Route 53でDNS設定済み）
- GitHubリポジトリ
- AWS S3バケット（画像アップロード用）

## デプロイ手順

### 1. EC2インスタンスの初期設定

```bash
# EC2にSSH接続
ssh -i your-key.pem ec2-user@your-ec2-ip

# 初期設定スクリプトを実行
chmod +x deploy/setup-ec2.sh
./deploy/setup-ec2.sh
```

### 2. GitHub Secretsの設定

GitHubリポジトリのSettings > Secrets and variables > Actionsで以下を設定：

- `EC2_HOST`: EC2のパブリックIP
- `EC2_USERNAME`: ec2-user
- `EC2_SSH_KEY`: EC2接続用の秘密鍵
- `ENV_FILE`: 環境変数ファイルの内容（base64エンコード）

### 3. 環境変数の設定

```bash
# 環境変数テンプレートをコピー
cp deploy/env.template .env

# 実際の値に編集
nano .env
```

### 4. MongoDBの起動

```bash
# Docker ComposeでMongoDBを起動
docker-compose up -d

# 状態確認
docker-compose ps
```

### 5. nginx設定（Amazon Linux 2標準）

```bash
# nginx設定ファイルをコピー
sudo cp deploy/nginx.conf /etc/nginx/nginx.conf
sudo cp deploy/werewolf-app.conf /etc/nginx/conf.d/

# ドメイン名を実際のドメインに変更
sudo sed -i 's/your-domain.com/your-actual-domain.com/g' /etc/nginx/conf.d/werewolf-app.conf

# 設定をテストしてリロード
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL証明書の取得

```bash
# Let's EncryptでSSL証明書を取得
chmod +x deploy/setup-ssl.sh
./deploy/setup-ssl.sh
```

### 7. アプリケーションのデプロイ

```bash
# アプリケーションディレクトリに移動
cd /var/www/werewolf-app

# リポジトリをクローン
git clone https://github.com/your-username/werewolf-app.git .

# デプロイスクリプトを実行
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

### 8. フロントエンドのデプロイ（別リポジトリの場合）

```bash
# フロントエンドディレクトリを作成
mkdir -p /var/www/werewolf-app/frontend
cd /var/www/werewolf-app/frontend

# フロントエンドリポジトリをクローン
git clone https://github.com/your-username/werewolf-frontend.git .

# 依存関係をインストールしてビルド
npm ci
npm run build
```

## 自動デプロイ

mainブランチにプッシュすると、GitHub Actionsが自動的にデプロイを実行します。

## 監視とログ

```bash
# PM2でアプリケーションの状態を確認
pm2 status
pm2 logs werewolf-backend

# nginxログを確認
sudo tail -f /var/log/nginx/werewolf-app.access.log
sudo tail -f /var/log/nginx/werewolf-app.error.log

# MongoDBログを確認
docker-compose logs mongodb
```

## トラブルシューティング

### よくある問題

1. **ポートが開いていない**

   - セキュリティグループで80, 443ポートを開放

2. **SSL証明書の取得に失敗**

   - ドメインのDNS設定を確認
   - nginxが正常に動作しているか確認

3. **アプリケーションが起動しない**

   - 環境変数が正しく設定されているか確認
   - PM2のログを確認

4. **データベース接続エラー**
   - MongoDBコンテナが起動しているか確認
   - 接続文字列を確認

## セキュリティ

- ファイアウォール設定
- 定期的なセキュリティアップデート
- ログの監視
- バックアップの設定

## バックアップ

```bash
# MongoDBのバックアップ
docker exec werewolf-mongodb mongodump --out /backup

# アプリケーションファイルのバックアップ
tar -czf /backup/app-$(date +%Y%m%d).tar.gz /var/www/werewolf-app
```
