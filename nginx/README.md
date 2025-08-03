# Nginx Production Container

本番環境用のNginxコンテナ設定です。

## 📁 ファイル構成

```
nginx/
├── Dockerfile.nginx          # 本番用Dockerfile
├── nginx.conf               # 基本nginx設定
├── werewolf-app.conf        # アプリケーション設定
├── .dockerignore           # Docker除外設定
└── README.md               # このファイル
```

## 🚀 使用方法

### 1. イメージのビルド

```bash
docker build -t werewolf-nginx -f nginx/Dockerfile.nginx nginx/
```

### 2. コンテナの起動

```bash
docker run -d \
  --name werewolf-nginx \
  -p 80:80 \
  -p 443:443 \
  -v /path/to/frontend/build:/var/www/werewolf-app/frontend/build:ro \
  -v /path/to/ssl/certs:/etc/letsencrypt:ro \
  -v nginx_logs:/var/log/nginx \
  werewolf-nginx
```

### 3. Docker Composeでの使用

```yaml
services:
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile.nginx
    container_name: werewolf-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - frontend_build:/var/www/werewolf-app/frontend/build:ro
      - ssl_certs:/etc/letsencrypt:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - backend
    networks:
      - werewolf-network
```

## ⚙️ 設定項目

### 環境変数

- `DOMAIN_NAME`: ドメイン名（例：werewolf-app.com）

### ボリューム

- `/var/www/werewolf-app/frontend/build`: フロントエンドビルドファイル
- `/etc/letsencrypt`: SSL証明書
- `/var/log/nginx`: ログファイル

### ポート

- `80`: HTTP（リダイレクト用）
- `443`: HTTPS（メイン）

## 🔒 セキュリティ

- SSL/TLS対応
- セキュリティヘッダー設定
- HSTS対応
- 適切なキャッシュ設定

## 📊 監視

### ヘルスチェック

```bash
curl http://localhost/health
```

### ログ確認

```bash
# アクセスログ
docker exec werewolf-nginx tail -f /var/log/nginx/werewolf-app.access.log

# エラーログ
docker exec werewolf-nginx tail -f /var/log/nginx/werewolf-app.error.log
```

## 🐛 トラブルシューティング

### SSL証明書の問題

```bash
# 証明書の確認
docker exec werewolf-nginx ls -la /etc/letsencrypt/live/

# nginx設定のテスト
docker exec werewolf-nginx nginx -t
```

### フロントエンドファイルの問題

```bash
# ファイルの存在確認
docker exec werewolf-nginx ls -la /var/www/werewolf-app/frontend/build/

# 権限の確認
docker exec werewolf-nginx ls -la /var/www/werewolf-app/
```

## 📝 注意事項

1. **SSL証明書**: Let's Encrypt証明書が必要
2. **フロントエンド**: ビルド済みファイルをマウント
3. **バックエンド**: `werewolf-backend:3000`でアクセス可能
4. **ドメイン**: 環境変数でドメイン名を設定

## 🔄 更新手順

1. 設定ファイルを変更
2. イメージを再ビルド
3. コンテナを再起動

```bash
docker-compose down
docker-compose build nginx
docker-compose up -d
```
