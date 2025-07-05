// MongoDB初期化スクリプト
// werewolfデータベースとユーザーを作成

// werewolfデータベースに切り替え
db = db.getSiblingDB("werewolf");

// アプリケーション用のユーザーを作成
db.createUser({
  user: process.env.MONGO_APP_USERNAME,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [
    {
      role: "readWrite",
      db: "werewolf",
    },
  ],
});

// 初期コレクションを作成（必要に応じて）
db.createCollection("channelblockusers");
db.createCollection("channels");
db.createCollection("channelusers");
db.createCollection("games");
db.createCollection("gameusers");
db.createCollection("messages");
db.createCollection("users");

print("MongoDB initialization completed successfully");
