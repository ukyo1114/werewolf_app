// コレクション初期化スクリプト
// 基本的なコレクションとインデックスを作成

// データベースを選択
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "werewolf");

// ユーザーコレクション
db.createCollection("users");
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

// ゲームコレクション
db.createCollection("games");
db.games.createIndex({ status: 1 });
db.games.createIndex({ createdAt: 1 });

// チャンネルコレクション
db.createCollection("channels");
db.channels.createIndex({ gameId: 1 });
db.channels.createIndex({ type: 1 });

// メッセージコレクション
db.createCollection("messages");
db.messages.createIndex({ channelId: 1, createdAt: 1 });
db.messages.createIndex({ userId: 1 });

// ゲームユーザーコレクション
db.createCollection("gameUsers");
db.gameUsers.createIndex({ gameId: 1, userId: 1 }, { unique: true });
db.gameUsers.createIndex({ gameId: 1, role: 1 });

// 投票コレクション
db.createCollection("votes");
db.votes.createIndex({ gameId: 1, phase: 1 });
db.votes.createIndex({ voterId: 1, gameId: 1 });

// ブロックユーザーコレクション
db.createCollection("blockedUsers");
db.blockedUsers.createIndex({ userId: 1, blockedUserId: 1 }, { unique: true });

print("コレクションとインデックスを作成しました");
print("作成されたコレクション:");
print("- users (ユーザー情報)");
print("- games (ゲーム情報)");
print("- channels (チャンネル情報)");
print("- messages (メッセージ)");
print("- gameUsers (ゲーム参加者)");
print("- votes (投票情報)");
print("- blockedUsers (ブロックユーザー)");
