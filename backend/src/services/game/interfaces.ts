import { IGameUser } from '@/models/GameUsers/GameUserTypes';
import GameManager from '@/classes/GameManager';

export const actionMap: Record<
  string,
  (game: GameManager, userId: string, selectedUser: string) => any
> = {
  playerState: (game, userId) => game.playerManager.getPlayerState(userId),
  vote: (game, userId, selectedUser) =>
    game.voteManager.receiveVote(userId, selectedUser),
  devineRequest: (game, userId, selectedUser) =>
    game.devineManager.receiveDevineRequest(userId, selectedUser),
  guardRequest: (game, userId, selectedUser) =>
    game.guardManager.receiveGuradRequest(userId, selectedUser),
  attackRequest: (game, userId, selectedUser) =>
    game.attackManager.receiveAttackRequest(userId, selectedUser),
  voteHistory: (game) => game.voteManager.voteHistory,
  devineResult: (game, userId) => game.devineManager.getDevineResult(userId),
  mediumResult: (game, userId) => game.mediumManager.getMediumResult(userId),
  guardHistory: (game, userId) => game.guardManager.getGuardHistory(userId),
  attackHistory: (game, userId) => game.attackManager.getAttackHistory(userId),
};

export interface IGameInfo {
  gameId: string;
  players: IGameUser[];
  currentDay: number;
  currentPhase: string;
  result: string;
}

export interface IGameService {
  joinGame(
    gameId: string,
    userId: string,
  ): Promise<{
    channelId: string;
    channelName: string;
    channelDescription: string;
    gameUsers: IGameUser[];
  }>;
  handleGameAction(
    gameId: string,
    userId: string,
    action: keyof typeof actionMap,
    selectedUser: string,
  ): Promise<any>;
  getGameList(userId: string, channelId: string): Promise<IGameInfo[]>;
}
