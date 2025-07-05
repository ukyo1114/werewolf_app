import User from '../../models/User';
import GameManager from '../../classes/GameManager';

export const createGameList = async (channelId: string) => {
  const filteredGames = GameManager.getGamesByChannelId(channelId);
  if (filteredGames.length === 0) return [];

  return Promise.all(
    filteredGames.map(
      async ({ gameId, result, phaseManager, playerManager }) => {
        const players = await User.find({
          _id: { $in: Object.keys(playerManager.players) },
        })
          .select('_id userName pic')
          .lean();

        return {
          gameId,
          players,
          currentDay: phaseManager.currentDay,
          currentPhase: phaseManager.currentPhase,
          result: result.value,
        };
      },
    ),
  );
};
