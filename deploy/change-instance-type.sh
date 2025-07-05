#!/bin/bash

# インスタンスタイプ変更スクリプト

INSTANCE_ID="i-1234567890abcdef0"  # 実際のインスタンスIDに変更
NEW_INSTANCE_TYPE="t3.small"

echo "=== インスタンスタイプ変更開始 ==="
echo "インスタンスID: $INSTANCE_ID"
echo "新しいインスタンスタイプ: $NEW_INSTANCE_TYPE"

# 現在のインスタンス状態を確認
echo "現在のインスタンス状態を確認中..."
CURRENT_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].State.Name' --output text)

echo "現在の状態: $CURRENT_STATE"

if [ "$CURRENT_STATE" = "running" ]; then
    echo "インスタンスが起動中です。停止します..."
    aws ec2 stop-instances --instance-ids $INSTANCE_ID
    
    echo "インスタンスが停止するまで待機中..."
    aws ec2 wait instance-stopped --instance-ids $INSTANCE_ID
    echo "インスタンスが停止しました。"
fi

# インスタンスタイプを変更
echo "インスタンスタイプを変更中..."
aws ec2 modify-instance-attribute --instance-id $INSTANCE_ID --instance-type Value=$NEW_INSTANCE_TYPE

if [ $? -eq 0 ]; then
    echo "インスタンスタイプの変更が完了しました。"
    
    # インスタンスを起動
    echo "インスタンスを起動中..."
    aws ec2 start-instances --instance-ids $INSTANCE_ID
    
    echo "インスタンスが起動するまで待機中..."
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    echo "インスタンスが起動しました。"
    
    # 新しいインスタンスタイプを確認
    NEW_TYPE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].InstanceType' --output text)
    echo "変更後のインスタンスタイプ: $NEW_TYPE"
    
else
    echo "エラー: インスタンスタイプの変更に失敗しました。"
    exit 1
fi

echo "=== インスタンスタイプ変更完了 ===" 