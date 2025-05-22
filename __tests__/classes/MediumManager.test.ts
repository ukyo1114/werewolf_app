jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import MediumManager from '../../src/classes/MediumManager';
import { mockGameId, mockUsers } from '../../__mocks__/mockdata';
import { gamePlayers } from '../../__mocks__/mockdata';
import { EventEmitter } from 'events';

describe('test MediumManager', () => {
  const phaseManager = new PhaseManager(new EventEmitter(), {
    value: 'running',
  });
  const playerManager = new PlayerManager(mockGameId, mockUsers);
  const mediumManager = new MediumManager(phaseManager, playerManager);

  beforeEach(() => {
    playerManager.players = gamePlayers();
  });

  afterAll(() => {
    const timerId = phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    jest.restoreAllMocks();
  });

  describe('medium', () => {
    const getLivingPlayersSpy = jest.spyOn(playerManager, 'getLivingPlayers');

    beforeEach(() => {
      getLivingPlayersSpy.mockClear();
    });

    it('正しい霊能結果が保存される', () => {
      mediumManager.medium('villager');
      expect(mediumManager.mediumResult[0].villager).toBe('villagers');

      mediumManager.medium('werewolf');
      expect(mediumManager.mediumResult[0].werewolf).toBe('werewolves');
      expect(getLivingPlayersSpy).toHaveBeenCalledWith('medium');
    });

    it('霊能力者が死亡しているとき', () => {
      mediumManager.mediumResult = {};
      playerManager.players.medium.status = 'dead';

      mediumManager.medium('villager');
      expect(mediumManager.mediumResult).not.toHaveProperty('villager');
      expect(getLivingPlayersSpy).toHaveBeenCalledWith('medium');
    });
  });

  describe('getMediumResult', () => {
    const validatePlayerByRoleSpy = jest.spyOn(
      playerManager,
      'validatePlayerByRole',
    );

    beforeEach(() => {
      validatePlayerByRoleSpy.mockClear();
    });

    it('霊能履歴を取得できる', () => {
      mediumManager.mediumResult = { 0: { villager: 'villagers' } };

      const mediumResult = mediumManager.getMediumResult('medium');
      expect(mediumResult).toEqual({ 0: { villager: 'villagers' } });
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith('medium', 'medium');
    });

    it('プレイヤーが霊能でないときエラーを返す', () => {
      expect(() => mediumManager.getMediumResult('villager')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'villager',
        'medium',
      );
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      expect(() => mediumManager.getMediumResult('notExist')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'notExist',
        'medium',
      );
    });
  });
});
