#!/bin/bash

# Amazon Linux 2023 サーバーセットアップスクリプト

echo "=== Amazon Linux 2023 サーバーセットアップ開始 ==="

# システムアップデート
echo "システムをアップデート中..."
sudo dnf update -y

# 必要なパッケージのインストール
echo "必要なパッケージをインストール中..."
sudo dnf install -y nginx
sudo dnf install -y docker
sudo dnf install -y git
sudo dnf install -y curl
sudo dnf install -y wget

# Dockerの起動と有効化
echo "Dockerを起動中..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Node.js v20のインストール（NodeSourceリポジトリを使用）
echo "Node.js v20をインストール中..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# PM2のインストール
echo "PM2をインストール中..."
sudo npm install -g pm2

# nginxの起動と有効化
echo "nginxを起動中..."
sudo systemctl start nginx
sudo systemctl enable nginx

# ファイアウォールの設定
echo "ファイアウォールを設定中..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# セキュリティ設定
echo "セキュリティ設定中..."
# SELinuxを無効化（必要に応じて）
# sudo setenforce 0
# sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config

# タイムゾーン設定
echo "タイムゾーンを設定中..."
sudo timedatectl set-timezone Asia/Tokyo

# システムリソース制限の調整
echo "システムリソース制限を調整中..."
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

echo "=== セットアップ完了 ==="
echo "システムを再起動してください: sudo reboot" 