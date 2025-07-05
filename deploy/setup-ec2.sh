#!/bin/bash

# EC2インスタンス初期設定スクリプト

# システムアップデート
sudo yum update -y

# 必要なパッケージのインストール
sudo yum install -y git docker nginx certbot python3-certbot-nginx ca-certificates wget tar

# Dockerの起動と自動起動設定
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# nginxの起動と自動起動設定
sudo systemctl start nginx
sudo systemctl enable nginx

# Node.jsのインストール（複数の方法を試行）
echo "Node.jsをインストール中..."

# 方法1: 手動インストール（バイナリ - 最も確実）
install_nodejs_manual() {
    echo "手動インストール（Node.js 18）を試行..."
    
    # 既存のNode.jsを削除（もしあれば）
    sudo yum remove -y nodejs npm 2>/dev/null || true
    sudo rm -f /usr/bin/node /usr/bin/npm 2>/dev/null || true
    
    # Node.js 18のバイナリをダウンロード（GLIBC 2.26対応）
    cd /tmp
    if wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz; then
        # 解凍
        tar -xf node-v18.19.0-linux-x64.tar.xz
        
        # システムディレクトリに移動
        sudo mv node-v18.19.0-linux-x64 /opt/nodejs
        
        # パスを設定
        echo 'export PATH=/opt/nodejs/bin:$PATH' | sudo tee -a /etc/profile.d/nodejs.sh
        source /etc/profile.d/nodejs.sh
        
        # シンボリックリンクを作成
        sudo ln -sf /opt/nodejs/bin/node /usr/bin/node
        sudo ln -sf /opt/nodejs/bin/npm /usr/bin/npm
        
        # 権限設定
        sudo chown -R root:root /opt/nodejs
        
        echo "手動インストール成功"
        return 0
    else
        echo "手動インストール失敗"
        return 1
    fi
}

# 方法2: Amazon Linux 2 Extras
install_nodejs_extras() {
    echo "Amazon Linux 2 Extrasからインストールを試行..."
    
    # 利用可能なNode.jsパッケージを確認
    if sudo amazon-linux-extras list | grep -q nodejs; then
        if sudo amazon-linux-extras install -y nodejs18; then
            echo "Amazon Linux 2 Extras（Node.js 18）からのインストール成功"
            return 0
        elif sudo amazon-linux-extras install -y nodejs16; then
            echo "Amazon Linux 2 Extras（Node.js 16）からのインストール成功"
            return 0
        fi
    fi
    
    echo "Amazon Linux 2 ExtrasにNode.jsが利用できません"
    return 1
}

# 方法3: NodeSourceリポジトリ（Node.js 16）
install_nodejs_nodesource() {
    echo "NodeSourceリポジトリ（Node.js 16）からインストールを試行..."
    
    # 既存のNode.jsを削除
    sudo yum remove -y nodejs npm 2>/dev/null || true
    
    # 古いリポジトリをクリア
    sudo rm -rf /etc/yum.repos.d/nodesource* 2>/dev/null || true
    
    # NodeSourceリポジトリを追加（Node.js 16）
    curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
    
    # Node.jsをインストール
    if sudo yum install -y nodejs; then
        echo "NodeSourceリポジトリ（Node.js 16）からのインストール成功"
        return 0
    else
        echo "NodeSourceリポジトリからのインストール失敗"
        return 1
    fi
}

# インストール方法を順番に試行（手動インストールを優先）
if ! install_nodejs_manual; then
    if ! install_nodejs_extras; then
        if ! install_nodejs_nodesource; then
            echo "すべてのNode.jsインストール方法が失敗しました"
            exit 1
        fi
    fi
fi

# Node.jsのバージョン確認
echo "最終確認 - Node.jsバージョン:"
node --version
echo "npmバージョン:"
npm --version

# PM2のインストール（プロセス管理）
echo "PM2をインストール中..."
sudo npm install -g pm2

# アプリケーションディレクトリの作成
sudo mkdir -p /var/www/werewolf-app
sudo chown ec2-user:ec2-user /var/www/werewolf-app

# nginx設定ディレクトリの確認（Amazon Linux 2標準）
# /etc/nginx/conf.d/ はデフォルトで存在するため、作成不要

echo "EC2初期設定が完了しました。"
echo "次にGitHub Actionsの設定を行ってください。" 