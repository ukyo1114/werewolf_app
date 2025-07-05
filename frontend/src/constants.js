export const PHASE_MAP = {
  pre: "準備中",
  day: "昼",
  night: "夜",
  finished: "終了",
};

export const RESULT_MAP = {
  running: "進行中",
  villagersWin: "村人勝利",
  werewolvesWin: "人狼勝利",
  villageAbandoned: "廃村",
};

export const USER_STATUS = {
  alive: "生存",
  dead: "死亡",
};

export const ROLE_MAP = {
  villager: "村人",
  seer: "占い師",
  medium: "霊能者",
  hunter: "狩人",
  werewolf: "人狼",
  madman: "狂人",
  spectator: "観戦者",
};

export const PHASE_DURATIONS = {
  pre: 30,
  day: 10 * 60,
  night: 3 * 60,
  finished: 10 * 60,
};

export const TITLE_MAP = {
  vote: "投票先を選択",
  fortune: "占い先を選択",
  guard: "護衛先を選択",
  attack: "襲撃先を選択",
};

export const MODE_MAP = {
  seer: "fortune",
  medium: "medium",
  hunter: "guard",
  werewolf: "attack",
};

export const GAME_MASTER = {
  _id: "672626acf66b851cf141bd0f",
  userName: "ゲームマスター",
  pic: "https://werewolf-app-images.s3.ap-northeast-1.amazonaws.com/user-icons%2F672626acf66b851cf141bd0f_profile.jpeg",
};
