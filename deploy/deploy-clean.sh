#!/bin/bash

# メモリクリア付きデプロイスクリプト

set -e

echo "=== メモリクリア付きデプロイ開始 ==="

# アプリケーションディレクトリに移動
cd /var/www/werewolf-app

# PM2プロセスを完全停止
echo "PM2プロセスを停止中..."
pm2 stop werewolf-backend || true
pm2 delete werewolf-backend || true

# メモリクリア
echo "メモリをクリア中..."
sudo sync
echo 3 | sudo tee /proc/sys/vm/drop_caches

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

# PM2でアプリケーションを新規起動
echo "アプリケーションを新規起動中..."
pm2 start dist/app.js --name werewolf-backend

# PM2の設定を保存
pm2 save

# nginxの設定をテスト
echo "nginx設定をテスト中..."
sudo nginx -t

# nginxを再起動
echo "nginxを再起動中..."
sudo systemctl reload nginx

echo "=== メモリクリア付きデプロイ完了 ==="
echo "アプリケーションの状態:"
pm2 status

echo "メモリ使用量:"
free -h 