// ユーザー作成専用スクリプト
// レプリカセット初期化後に実行

// データベースを選択
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "werewolf");

// アプリケーション用ユーザーを作成
// バックエンドアプリケーションが使用するユーザー
db.createUser({
  user: process.env.MONGO_APP_USERNAME || "werewolf_app",
  pwd: process.env.MONGO_APP_PASSWORD || "werewolf_app_password",
  roles: [
    {
      role: "readWrite",
      db: process.env.MONGO_INITDB_DATABASE || "werewolf",
    },
  ],
});

print("アプリケーション用ユーザーを作成しました");
print("ユーザー名: " + (process.env.MONGO_APP_USERNAME || "werewolf_app"));

// 管理者用ユーザーを作成
// データベース管理・メンテナンス用のユーザー
db.createUser({
  user: process.env.MONGO_ADMIN_USERNAME || "werewolf_admin",
  pwd: process.env.MONGO_ADMIN_PASSWORD || "werewolf_admin_password",
  roles: [
    {
      role: "dbOwner",
      db: process.env.MONGO_INITDB_DATABASE || "werewolf",
    },
    {
      role: "clusterAdmin",
      db: "admin",
    },
  ],
});

print("管理者用ユーザーを作成しました");
print("ユーザー名: " + (process.env.MONGO_ADMIN_USERNAME || "werewolf_admin"));

print("\n=== 作成されたユーザー ===");
print("1. アプリケーション用:");
print("   ユーザー名: " + (process.env.MONGO_APP_USERNAME || "werewolf_app"));
print(
  "   パスワード: " +
    (process.env.MONGO_APP_PASSWORD || "werewolf_app_password")
);
print("   権限: 読み書き権限 (readWrite)");
print("");
print("2. 管理者用:");
print(
  "   ユーザー名: " + (process.env.MONGO_ADMIN_USERNAME || "werewolf_admin")
);
print(
  "   パスワード: " +
    (process.env.MONGO_ADMIN_PASSWORD || "werewolf_admin_password")
);
print("   権限: データベース所有者 + クラスター管理");
