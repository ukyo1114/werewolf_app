#!/bin/bash

# Let's Encrypt SSL証明書取得スクリプト

DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

echo "=== Let's Encrypt SSL証明書取得開始 ==="

# ドメイン名を確認
echo "ドメイン: $DOMAIN"
echo "メールアドレス: $EMAIL"

# nginx設定を一時的にHTTPのみに変更
echo "nginx設定を一時的に変更中..."
sudo cp /etc/nginx/sites-available/werewolf-app.conf /etc/nginx/sites-available/werewolf-app.conf.backup

# HTTP設定のみの一時ファイルを作成
sudo tee /etc/nginx/sites-available/werewolf-app-temp.conf > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        root /var/www/werewolf-app/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 一時設定を有効化
sudo ln -sf /etc/nginx/sites-available/werewolf-app-temp.conf /etc/nginx/sites-enabled/werewolf-app.conf
sudo nginx -t
sudo systemctl reload nginx

# Let's Encrypt証明書を取得
echo "SSL証明書を取得中..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# 元の設定を復元
echo "nginx設定を復元中..."
sudo rm /etc/nginx/sites-enabled/werewolf-app.conf
sudo ln -sf /etc/nginx/sites-available/werewolf-app.conf /etc/nginx/sites-enabled/werewolf-app.conf

# ドメイン名を実際のドメインに置換
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/werewolf-app.conf

# nginx設定をテストして再起動
sudo nginx -t
sudo systemctl reload nginx

# 証明書の自動更新を設定
echo "証明書の自動更新を設定中..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "=== SSL証明書取得完了 ==="
echo "証明書の有効期限を確認:"
sudo certbot certificates

echo "自動更新の設定を確認:"
sudo crontab -l 