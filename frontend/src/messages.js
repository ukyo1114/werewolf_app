export const errors = {
  FETCH_GAME_LIST: "ゲームリストの取得に失敗しました",
  NO_IMAGE_SELECTED: "画像が選択されていません",
  MISSING_FIELDS: "未入力の項目があります",
  PASSWORD_MISMATCH: "確認用パスワードが一致しません",
  LOGIN_FAILED: "ログインに失敗しました",

  CHANNEL_CREATION_FAILED: "チャンネルの作成に失敗しました",
  CHANNEL_SETTINGS_FAILED: "チャンネル設定に失敗しました",
  IMAGE_NOT_SELECTED: "画像が選択されていません",
  PROFILE_SETTINGS_FAILED: "プロフィールの変更に失敗しました",
  USER_SETTINGS_FAILED: "ユーザー情報の更新に失敗しました",

  USER_BLOCKED: "ブロックされています",
  CHANNEL_ENTER_FAILED: "チャンネルへの入室に失敗しました",
  FETCH_CHANNEL_LIST: "チャンネルリストの取得に失敗しました",
  SIGNUP_FAILED: "ユーザーの作成に失敗しました",
  PLAYER_LOAD_FAILED: "プレイヤーの読み込みに失敗しました",

  GAME_NOT_FOUND: "ゲームが見つかりません",
  CONNECTION_FAILED: "接続に失敗しました",
  FETCH_VOTE_HISTORY_FAILED: "投票履歴の取得に失敗しました",
  FETCH_FORTUNE_RESULT_FAILED: "占い結果の取得に失敗しました",
  FETCH_MEDIUM_RESULT_FAILED: "霊能結果の取得に失敗しました",

  FETCH_GUARD_HISTORY_FAILED: "護衛履歴の取得に失敗しました",
  FETCH_ATTACK_HISTORY_FAILED: "襲撃履歴の取得に失敗しました",
  PASSWORD_RESET_FAILED: "パスワードの再設定に失敗しました",
};

export const messages = {
  USER_REGISTERED: "ユーザーが登録されました",
  USER_LOGIN: "ログインしました",
  CHANNEL_CREATED: "チャンネルを作成しました",
  CHANNEL_SETTINGS_CHANGED: "チャンネル設定が変更されました",
  PROFILE_SETTINGS_CHANGED: "プロフィールが変更されました",
  
  USER_SETTINGS: {
    email: "変更後のメールアドレス宛に確認メールを送信しました。メール内のリンクをクリックして、認証を完了してください。",
    password: "パスワードが変更されました",
  },

  PASSWORD_RESET: {
    email: (email) => (`【${email}】宛に確認メールを送信しました。メール内のリンクをクリックして、パスワードを再設定してください。`),
  },
  NAVIGATE_GAME: "参加中のゲームに移動しました",
  NO_ACTIVE_GAME: "進行中のゲームがありません",
  LEFT_CHANNEL: "チャンネルから退出しました",
  BLOCK_COMPLETED: "ブロックしました",
  BLOCK_CANCEL_COMPLETED: "ブロックを解除しました",
};