import User from '../../models/User';
import GameManager from '../../classes/GameManager';

export const createGameList = async (channelId: string) => {
  const filteredGames = GameManager.getGamesByChannelId(channelId);
  if (!filteredGames.length) return [];

  return Promise.all(
    filteredGames.map(
      async ({ gameId, result, phaseManager, playerManager }) => {
        const playersDetail = await User.find({
          _id: { $in: Object.keys(playerManager.players) },
        }).select('_id userName pic');

        return {
          gameId,
          players: playersDetail.map(({ _id, userName, pic }) => ({
            _id: _id.toString(),
            userName,
            pic,
          })),
          currentDay: phaseManager.currentDay,
          currentPhase: phaseManager.currentPhase,
          result: result.value,
        };
      },
    ),
  );
};
