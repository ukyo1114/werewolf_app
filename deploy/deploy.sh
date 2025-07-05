#!/bin/bash

# werewolfアプリデプロイスクリプト

set -e

echo "=== werewolfアプリデプロイ開始 ==="

# アプリケーションディレクトリに移動
cd /var/www/werewolf-app

# 最新のコードを取得
echo "最新のコードを取得中..."
git pull origin main

# 依存関係をインストール
echo "依存関係をインストール中..."
npm ci --production

# 環境変数ファイルが存在するかチェック
if [ ! -f .env ]; then
    echo "警告: .envファイルが見つかりません。"
    echo "GitHub Secretsから環境変数を設定してください。"
fi

# PM2でアプリケーションを再起動
echo "アプリケーションを再起動中..."
if pm2 list | grep -q "werewolf-backend"; then
    pm2 restart werewolf-backend
else
    pm2 start dist/app.js --name werewolf-backend
fi

# PM2の設定を保存
pm2 save

# nginxの設定をテスト
echo "nginx設定をテスト中..."
sudo nginx -t

# nginxを再起動
echo "nginxを再起動中..."
sudo systemctl reload nginx

echo "=== デプロイ完了 ==="
echo "アプリケーションの状態:"
pm2 status 