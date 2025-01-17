export const database = {
  CONNECT_SUCCESS: 'MongoDB に接続しました。',
  CONNECT_SKIPPED: 'テスト環境ではデータベース接続をスキップします。',
  URI_NOT_DEFINED: 'MONGO_URI が定義されていません。',
};

export const errors = {
  UNEXPECTED_ERROR: '予期しないエラーが発生しました。',
  EMAIL_SEND_FAILED: 'メールの送信に失敗しました。',
  JWT_SECRET_NOT_DEFINED: '環境変数に JWT_SECRET が定義されていません。',
  INVALID_TOKEN: '認証トークンが無効です。',
  USER_NOT_FOUND: 'ユーザーが見つかりません。',
  EMAIL_ALREADY_REGISTERED: 'メールアドレスが既に登録されています。',
  EMAIL_NOT_FOUND: 'メールアドレスが登録されていません。',
  WRONG_PASSWORD: 'パスワードが間違っています。',
  NO_UPDATE_DATA: '更新するデータがありません。',
  SERVER_ERROR: 'サーバーエラーが発生しました。',
};

export const validation = {
  INVALID_EMAIL: '有効なメールアドレスを入力してください。',
  USER_NAME_LENGTH: 'ユーザー名は1文字以上20文字以内で入力してください。',
  PASSWORD_LENGTH: 'パスワードは8文字以上128文字以内で入力してください。',
  INVALID_PIC: '画像の形式が無効です。',
};

export const gameError = {
  INVALID_VOTE: '投票が無効です。',
  INVALID_FORTUNE: '占い先が無効です。',
  INVALID_GUARD: '護衛先が無効です。',
  INVALID_ATTACK: '襲撃先が無効です。',
  // VOTE_HISTORY_NOT_FOUND: '投票履歴が取得できません。',
};
