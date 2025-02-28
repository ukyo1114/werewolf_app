import { getGamesByChannelId } from '../../classes/GameInstanceManager';
import User from '../../models/userModel';

export const createGameList = async (channelId: string) => {
  const filteredGames = getGamesByChannelId(channelId);
  if (filteredGames.length === 0) return [];

  // 各ゲームごとに情報を取得
  const gameList = await Promise.all(
    filteredGames.map((game) => {
      const { gameId, result } = game;
      const { currentDay, currentPhase } = game.phaseManager;

      const players = Object.keys(game.playerManager.players);

      return User.find({ _id: { $in: players } })
        .populate('_id userName pic')
        .then((playersDetail) => ({
          gameId,
          players: playersDetail,
          currentDay,
          currentPhase,
          result: result.value,
        }));
    }),
  );

  return gameList;
};
