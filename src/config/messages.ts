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
  CHANNEL_ACCESS_FORBIDDEN: 'チャンネルを利用できません。',
  MESSAGE_SENDING_FORBIDDEN: 'メッセージの送信が禁止されています。',
  GAME_NOT_FOUND: 'ゲームが見つかりません。',
  CHANNEL_NOT_FOUND: 'チャンネルが見つかりません。',
  PERMISSION_DENIED: '権限がありません。',
  USER_ALREADY_BLOCKED: 'ユーザーが既にブロックされています。',
  USER_NOT_BLOCKED: 'ユーザーはブロックされていません',
  DENIED_SELF_BLOCK: '自分自身をブロックすることはできません。',
  USER_BLOCKED: 'ブロックされています。',
  GUEST_CREATE_CHANNEL_DENIED:
    'ゲストアカウントではチャンネルを作成できません。',
  GUEST_ENTRY_DENIED: 'ゲストアカウントでは入室できません。',
  ADMIN_LEAVE_DENIED: '管理者は退出できません。',
  USER_ALREADY_LEFT: 'ユーザーは既に退出済みです。',
  GAME_ACCESS_FORBIDDEN: 'ゲームを利用できません。',
  GAME_IS_PROCESSING: '集計中のため受付できません。',
};

export const validation = {
  INVALID_EMAIL: '有効なメールアドレスを入力してください。',
  USER_NAME_LENGTH: 'ユーザー名は1文字以上20文字以内で入力してください。',
  PASSWORD_LENGTH: 'パスワードは8文字以上64文字以内で入力してください。',
  INVALID_PIC: '画像の形式が無効です。',
  INVALID_CHANNEL_ID: 'チャンネルIDが無効です。',
  INVALID_SELECTED_USER: '選択されたユーザーが無効です。',
  CHANNEL_NAME_LENGTH: 'チャンネル名は1文字以上20文字以内で入力してください。',
  CHANNEL_DESCRIPTION_LENGTH:
    '説明文は1文字以上2000文字以内で入力してください。',
  INVALID_GAME_ID: 'ゲームIDが無効です。',
};

export const gameError = {
  INVALID_VOTE: '投票が無効です。',
  INVALID_FORTUNE: '占い先が無効です。',
  INVALID_GUARD: '護衛先が無効です。',
  INVALID_ATTACK: '襲撃先が無効です。',
  VOTE_HISTORY_NOT_FOUND: '投票履歴が取得できません。',
  FORTUNE_RESULT_NOT_FOUND: '占い結果が取得できません。',
  MEDIUM_RESULT_NOT_FOUND: '霊能結果が取得できません。',

  GUARD_HISTORY_NOT_FOUND: '護衛履歴が取得できません。',
  ATTACK_HISTORY_NOT_FOUND: '襲撃履歴が取得できません。',
  PLAYER_NOT_FOUND: 'プレイヤーが見つかりません。',
};

export const gameMaster = {
  PREPARATION:
    '村の中に人狼が紛れ込んでしまいましたわ。きゃー。みなさんでぎゃふんと言わせちゃいましょうね。',
  MORNING:
    'ふわぁー。おはようございますわ。今日も一日はりきっていきましょうね。',
  NIGHT:
    'わおーん。しずかな夜に狼の遠吠えが響いていますわね。ではおやすみなさいませ。',
  EXECUTION: (player: string) =>
    `投票の結果、【${player}】さんが処刑されましたわ。これでよかったのかしら。しくしく。`,
  KILL_IMMORALIST: (players: string[]) =>
    `${players.map((player) => `【${player}】`).join('、')}さんが狐の後を追って死亡しました。`,
  ATTACK: (players: string[]) =>
    players.length > 0
      ? `もぐもぐ。${players.map((player) => `【${player}】`).join('、')}】さんが昨夜襲撃されましたわ。`
      : 'あら、昨夜は誰も犠牲にならなかったようですわ。ラッキーでしたわね。',
  VILLAGERS_WIN:
    '村に平和が戻りました。めでたしめでたし。村人チームの勝利ですわ。',
  WEREWOLVES_WIN:
    '人狼は村をほろぼすと、次の標的を求めて去っていきました。ぱちぱち。人狼チームの勝利ですわ。',
  FOXES_WIN: '狐の勝利',
  VILLAGE_ABANDONED:
    '投票者がいなかった為、この村は廃村になってしまいました。また遊んでくださいね。',
  TIME_REDUCTION: '時短', // 時短実装後に変更
};
