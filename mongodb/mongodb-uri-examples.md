# MongoDB接続URI例

## 基本設定

### レプリカセット接続（推奨）

```bash
# アプリケーション用
MONGO_URI=mongodb://werewolf_app:werewolf_app_password@localhost:27017,localhost:27018,localhost:27019/werewolf?replicaSet=rs0&authSource=werewolf

# 管理者用
MONGO_ADMIN_URI=mongodb://werewolf_admin:werewolf_admin_password@localhost:27017,localhost:27018,localhost:27019/werewolf?replicaSet=rs0&authSource=werewolf
```

### プライマリノード直接接続

```bash
# アプリケーション用（開発用）
MONGO_URI=mongodb://werewolf_app:werewolf_app_password@localhost:27017/werewolf?authSource=werewolf

# 管理者用（開発用）
MONGO_ADMIN_URI=mongodb://werewolf_admin:werewolf_admin_password@localhost:27017/werewolf?authSource=werewolf
```

## 環境変数での設定

### .envファイル

```bash
# データベース設定
MONGO_INITDB_DATABASE=werewolf

# ユーザー設定
MONGO_APP_USERNAME=werewolf_app
MONGO_APP_PASSWORD=werewolf_app_password
MONGO_ADMIN_USERNAME=werewolf_admin
MONGO_ADMIN_PASSWORD=werewolf_admin_password

# 接続URI
MONGO_URI=mongodb://werewolf_app:werewolf_app_password@localhost:27017,localhost:27018,localhost:27019/werewolf?replicaSet=rs0&authSource=werewolf
MONGO_ADMIN_URI=mongodb://werewolf_admin:werewolf_admin_password@localhost:27017,localhost:27018,localhost:27019/werewolf?replicaSet=rs0&authSource=werewolf
```

## URIパラメータの説明

- `replicaSet=rs0`: レプリカセット名
- `authSource=werewolf`: 認証データベース
- `directConnection=true`: 直接接続（レプリカセット使用時は不要）

## 接続方法の選択

### 本番環境（推奨）

- レプリカセット接続を使用
- 高可用性とフェイルオーバー対応

### 開発環境

- プライマリノード直接接続でも可
- シンプルな設定で開発効率向上
