import { appState, Events } from '../../config/appState';
import { IGameService, actionMap, IGameInfo } from './interfaces';
import { IGameUser } from '../../models/GameUsers/GameUserTypes';
import Users from '../../models/Users';
import ChannelUsers from '../../models/ChannelUsers';
import Games from '../../models/Games';
import GameUsers from '../../models/GameUsers';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import GameManager from '../../classes/GameManager';

const { gameManagers } = appState;
const { channelEvents } = Events;

export class GameService implements IGameService {
  async joinGame(
    gameId: string,
    userId: string,
  ): Promise<{
    channelId: string;
    channelName: string;
    channelDescription: string;
    gameUsers: IGameUser[];
  }> {
    const { channelId, channelName, channelDescription } =
      await Games.getGameInfo(gameId);
    await this.checkCanUserJoinGame(gameId, channelId, userId);
    await GameUsers.joinGame(gameId, userId);
    const [gameUsers] = await Promise.all([
      GameUsers.getGameUsers(gameId),
      this.emitUserJoined(gameId, userId),
    ]);
    return { channelId, channelName, channelDescription, gameUsers };
  }

  private async checkCanUserJoinGame(
    gameId: string,
    channelId: string,
    userId: string,
  ): Promise<void> {
    const isGameExists = !!gameManagers[gameId];
    const isUserInChannel = await ChannelUsers.isUserInChannel(
      channelId,
      userId,
    );
    if (!isGameExists || !isUserInChannel)
      throw new AppError(403, errors.GAME_ACCESS_FORBIDDEN);
  }

  private async emitUserJoined(gameId: string, userId: string) {
    const user = await Users.findById(userId)
      .select('_id userName pic isGuest')
      .lean();
    channelEvents.emit('userJoined', {
      channelId: gameId,
      user,
    });
  }

  async handleGameAction(
    gameId: string,
    userId: string,
    action: keyof typeof actionMap,
    selectedUser: string,
  ): Promise<any> {
    const game = await this.checkCanUserAccessGame(gameId, userId);
    const result = actionMap[action](game, userId, selectedUser);
    return result;
  }

  private async checkCanUserAccessGame(
    gameId: string,
    userId: string,
  ): Promise<GameManager> {
    const game = gameManagers[gameId];
    const isUserInGame = await GameUsers.exists({ gameId, userId });
    if (!game || !isUserInGame)
      throw new AppError(403, errors.GAME_ACCESS_FORBIDDEN);
    if (game.isProcessing) throw new AppError(409, errors.GAME_IS_PROCESSING);
    return game;
  }

  async getGameList(userId: string, channelId: string): Promise<IGameInfo[]> {
    await ChannelUsers.checkUserInChannel(channelId, userId);
    return this.createGameList(channelId);
  }

  async createGameList(channelId: string): Promise<IGameInfo[]> {
    const filteredGames = GameManager.getGamesByChannelId(channelId);
    if (filteredGames.length === 0) return [];
    return Promise.all(
      filteredGames.map(async (game) => {
        const {
          gameId,
          result,
          phaseManager: { currentDay, currentPhase },
        } = game;
        const players = await GameUsers.getGamePlayers(gameId);
        return {
          gameId,
          players,
          currentDay,
          currentPhase,
          result: result.value,
        };
      }),
    );
  }
}

export const gameService = new GameService();
