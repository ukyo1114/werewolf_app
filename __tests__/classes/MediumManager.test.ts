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
  beforeAll(() => {
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
    gameManagers[mockGameId].sendMessage = jest.fn();
  });

  afterAll(() => {
    const timerId = gameManagers[mockGameId]?.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);

    delete gameManagers[mockGameId];
    jest.restoreAllMocks();
  });

  describe('medium', () => {
    it('正しい霊能結果が保存される', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        medium: {
          userId: 'medium',
          userName: 'medium',
          status: 'alive',
          role: 'medium',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      game.mediumManager.medium('villager');
      const mediumResult = game.mediumManager.mediumResult;

      expect(mediumResult).toEqual({ 0: { villager: 'villagers' } });
    });
  });

  describe('getMediumResult', () => {
    it('霊能履歴を取得できる', () => {
      const game = gameManagers[mockGameId];
      game.mediumManager.mediumResult = { 0: { villager: 'villagers' } };

      const mediumResult = game.mediumManager.getMediumResult('medium');
      expect(mediumResult).toEqual({ 0: { villager: 'villagers' } });
    });

    it('プレイヤーが霊能でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.playerManager.players.villager).toBeDefined();
      expect(() => game.mediumManager.getMediumResult('villager')).toThrow();
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.playerManager.players.medium).toBeUndefined();
      expect(() => game.mediumManager.getMediumResult('villager')).toThrow();
    });
  });
});
