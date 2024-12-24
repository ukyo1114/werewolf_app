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
};

export const validation = {
  INVALID_EMAIL: '有効なメールアドレスを入力してください。',
};
