# MongoDB 初期化スクリプト

このディレクトリには、MongoDBレプリカセットの初期化に使用するスクリプトが含まれています。

## ファイル構成

### 1. `init-replica.js`

- レプリカセットの初期化
- プライマリ・セカンダリノードの設定
- 基本ユーザーの作成

### 2. `init-users.js`

- アプリケーション用ユーザーの作成
- 権限別ユーザー設定
- セキュリティ設定

### 3. `init-collections.js`

- データベースコレクションの作成
- インデックスの設定
- スキーマ初期化

## 使用方法

### 1. 環境変数の設定

```bash
# .envファイルを作成
MONGO_INITDB_DATABASE=werewolf
MONGO_APP_USERNAME=werewolf_app
MONGO_APP_PASSWORD=werewolf_app_password
MONGO_ADMIN_USERNAME=werewolf_admin
MONGO_ADMIN_PASSWORD=werewolf_admin_password
```

### 2. コンテナ起動

```bash
docker-compose up -d
```

### 3. 手動で初期化スクリプトを実行

#### プライマリノードに接続

```bash
docker exec -it werewolf-mongodb-primary mongosh
```

#### レプリカセット初期化（初回のみ）

```javascript
// レプリカセットが未初期化の場合のみ実行
load("/docker-entrypoint-initdb.d/init-replica.js");
```

#### ユーザー作成

```javascript
// ユーザー作成スクリプトを実行
load("/docker-entrypoint-initdb.d/init-users.js");
```

#### コレクション作成

```javascript
// コレクション作成スクリプトを実行
load("/docker-entrypoint-initdb.d/init-collections.js");
```

### 4. 実行結果の確認

```javascript
// レプリカセットの状態確認
rs.status()

// ユーザー一覧確認
db.getUsers()

// データベース一覧確認
show dbs

// コレクション一覧確認
use werewolf
show collections
```

## 作成されるユーザー

| ユーザー名     | パスワード              | 権限                                | 用途                           |
| -------------- | ----------------------- | ----------------------------------- | ------------------------------ |
| werewolf_app   | werewolf_app_password   | 読み書き権限 (readWrite)            | バックエンドアプリケーション   |
| werewolf_admin | werewolf_admin_password | データベース所有者 + クラスター管理 | データベース管理・メンテナンス |

## 環境変数でのカスタマイズ

`.env`ファイルでユーザー設定を変更できます：

```bash
# データベース設定
MONGO_INITDB_DATABASE=werewolf

# アプリケーション用ユーザー
MONGO_APP_USERNAME=my_app_user
MONGO_APP_PASSWORD=my_secure_password

# 管理者用ユーザー
MONGO_ADMIN_USERNAME=my_admin_user
MONGO_ADMIN_PASSWORD=my_admin_password
```

## 注意事項

- レプリカセット初期化（`init-replica.js`）は一度のみ実行可能です
- 既にレプリカセットが初期化済みの場合は、ユーザー作成とコレクション作成のみ実行してください
- レプリカセットの初期化は時間がかかる場合があります
- 本番環境では、パスワードをより強力なものに変更してください
- 手動実行により、エラーが発生した場合の対処が容易になります
