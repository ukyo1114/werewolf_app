#!/bin/bash

echo "Creating MongoDB user with environment variables..."
echo "MONGO_APP_USERNAME: ${MONGO_APP_USERNAME:-werewolf_user}"
echo "MONGO_APP_PASSWORD: ${MONGO_APP_PASSWORD:-werewolf_password}"

# アプリケーションユーザーを作成
mongosh <<EOF
use werewolf
db.createUser({
  user: "${MONGO_APP_USERNAME:-werewolf_user}",
  pwd: "${MONGO_APP_PASSWORD:-werewolf_password}",
  roles: [{ role: "readWrite", db: "werewolf" }]
})
EOF

# 初期コレクションを作成
mongosh <<EOF
use werewolf
db.createCollection("channelblockusers")
db.createCollection("channels")
db.createCollection("channelusers")
db.createCollection("games")
db.createCollection("gameusers")
db.createCollection("messages")
db.createCollection("users")
EOF

echo "MongoDB initialization completed successfully" 