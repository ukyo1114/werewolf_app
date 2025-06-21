import { Response, RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import User from '../../models/User';
import ChannelUser from '../../models/ChannelUser';
import Game from '../../models/Game';
import GameUser from '../../models/GameUser';
import GameManager from '../../classes/GameManager';
import { appState, Events } from '../../app';
import { CustomRequest } from '../../config/types';

const { gameManagers } = appState;
const { channelEvents } = Events;

export const joinGame = asyncHandler(
  async (
    req: CustomRequest<{}, { gameId: string }>,
    res: Response,
  ): Promise<void> => {
    const userId = req.userId as string;
    const { gameId } = req.params;
    if (!gameManagers[gameId]) throw new AppError(403, errors.GAME_NOT_FOUND);

    const game = await Game.findById(gameId)
      .select('_id channelId')
      .populate('channelId', '_id channelName channelDescription')
      .lean();
    if (!game) throw new AppError(403, errors.GAME_NOT_FOUND);
    const channelId = game.channelId._id.toString();

    if (!(await ChannelUser.isUserInChannel(channelId, userId)))
      throw new AppError(403, errors.GAME_ACCESS_FORBIDDEN);

    await GameUser.joinGame(gameId, userId);

    const [gameUsers, user] = await Promise.all([
      GameUser.getGameUsers(gameId),
      User.findById(userId).select('_id userName pic isGuest').lean(),
    ]);

    channelEvents.emit('userJoined', { channelId: gameId, user });
    res.status(200).json({ game, users: gameUsers });
  },
);

const actionMap: Record<
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

export const handleGameAction = (
  actionKey: keyof typeof actionMap,
): RequestHandler<{ gameId: string }, any, { selectedUser: string }> =>
  asyncHandler(
    async (
      req: CustomRequest<{ selectedUser: string }, { gameId: string }>,
      res: Response,
    ): Promise<void> => {
      const { userId } = req as { userId: string };
      const { gameId } = req.params;
      const { selectedUser } = req.body;

      const game = gameManagers[gameId];
      if (!game) throw new AppError(403, errors.GAME_NOT_FOUND);
      if (game.isProcessing) throw new AppError(409, errors.GAME_IS_PROCESSING);

      if (!(await GameUser.exists({ gameId, userId })))
        throw new AppError(403, errors.GAME_ACCESS_FORBIDDEN);

      const result = actionMap[actionKey](game, userId, selectedUser);

      result ? res.status(200).json(result) : res.status(200).send();
    },
  );
