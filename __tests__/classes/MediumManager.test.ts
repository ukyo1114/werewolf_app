jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
}));
import GameManager from '../../src/classes/GameManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

describe('test MediumManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
    // sendMessageをモック
    gameManagers[mockGameId].sendMessage = jest.fn();
  });

  afterAll(() => {
    delete gameManagers[mockGameId];
    jest.restoreAllMocks();
  });

  describe('medium', () => {
    it('正しい霊能結果が保存される', () => {
      const game = gameManagers[mockGameId];
      const phaseManager = game.phaseManager;

      phaseManager.nextPhase();

      expect(phaseManager.currentDay).toBe(1);

      const playerId = mockUsers[1].userId;
      const playerRole = game.playerManager.players[playerId].role;
      const result = playerRole === 'werewolf' ? 'werewolves' : 'villagers';

      game.mediumManager.medium(playerId);

      const mediumResult = game.mediumManager.mediumResult;

      expect(mediumResult).toEqual({
        1: { [playerId]: result },
      });
    });
  });

  describe('getMediumResult', () => {
    it('霊能履歴が正しい形式で取得できる', () => {
      const game = gameManagers[mockGameId];
      const phaseManager = game.phaseManager;

      phaseManager.nextPhase();

      expect(phaseManager.currentDay).toBe(1);

      const mediumId = game.playerManager.findPlayerByRole('medium').userId;
      const playerId = mockUsers[1].userId;
      const playerRole = game.playerManager.players[playerId].role;
      const result = playerRole === 'werewolf' ? 'werewolves' : 'villagers';

      game.mediumManager.medium(playerId);

      const mediumResult = game.mediumManager.getMediumResult(mediumId);

      expect(mediumResult).toEqual({
        1: { [playerId]: result },
      });
    });

    it('霊能結果を不正に取得しようとするとエラーが返されること', () => {
      const game = gameManagers[mockGameId];
      const phaseManager = game.phaseManager;

      const mediumId = game.playerManager.findPlayerByRole('medium').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;
      const playerId = mockUsers[1].userId;
      const playerRole = game.playerManager.players[playerId].role;
      const result = playerRole === 'werewolf' ? 'werewolves' : 'villagers';

      // preフェーズに取得しようとしたとき
      expect(() => game.mediumManager.getMediumResult(playerId)).toThrow(
        new AppError(403, gameError.MEDIUM_RESULT_NOT_FOUND),
      );

      phaseManager.nextPhase();
      expect(phaseManager.currentDay).toBe(1);

      game.mediumManager.medium(playerId);

      // 霊能以外のプレイヤーが取得しようとしたとき
      expect(() => game.mediumManager.getMediumResult(villagerId)).toThrow(
        new AppError(403, gameError.MEDIUM_RESULT_NOT_FOUND),
      );
    });
  });
});
