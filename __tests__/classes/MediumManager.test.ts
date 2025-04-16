import { gameManagers } from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import { mockChannelId, mockGameId, mockUsers } from '../../__mocks__/mockdata';
import { gamePlayers } from '../../__mocks__/mockdata';

describe('test MediumManager', () => {
  beforeAll(() => {
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
    gameManagers[mockGameId].sendMessage = jest.fn();
  });

  beforeEach(() => {
    const game = gameManagers[mockGameId];
    game.playerManager.players = structuredClone(gamePlayers);
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

      game.mediumManager.medium('villager');
      expect(game.mediumManager.mediumResult[0].villager).toBe('villagers');

      game.mediumManager.medium('werewolf');
      expect(game.mediumManager.mediumResult[0].werewolf).toBe('werewolves');
    });

    it('霊能力者が死亡しているとき', () => {
      const game = gameManagers[mockGameId];
      game.mediumManager.mediumResult = {};
      game.playerManager.players.medium.status === 'dead';

      game.mediumManager.medium('villager');
      expect(game.mediumManager.mediumResult).not.toHaveProperty('villager');
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

      expect(() => game.mediumManager.getMediumResult('villager')).toThrow();
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(() => game.mediumManager.getMediumResult('notExist')).toThrow();
    });
  });
});
