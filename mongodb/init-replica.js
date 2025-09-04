// MongoDB レプリカセット初期化スクリプト
// このスクリプトはプライマリノードでのみ実行される

// レプリカセットの設定
rsconf = {
  _id: "rs0",
  members: [
    {
      _id: 0,
      host: "mongodb-primary:27017",
      priority: 2,
    },
    {
      _id: 1,
      host: "mongodb-secondary-1:27017",
      priority: 1,
    },
    {
      _id: 2,
      host: "mongodb-secondary-2:27017",
      priority: 1,
    },
  ],
};

// レプリカセットを初期化
rs.initiate(rsconf);

print("レプリカセット 'rs0' を初期化しました");

// レプリカセットの初期化完了を待機
print("レプリカセットの初期化完了を待機中...");

// プライマリノードになるまで待機
while (rs.status().ok !== 1) {
  print("初期化中...");
  sleep(1000); // 1秒待機
}

print("レプリカセットの初期化が完了しました");
print("プライマリノードとして動作中です");
