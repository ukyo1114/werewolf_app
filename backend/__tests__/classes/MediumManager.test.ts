jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import { EventEmitter } from 'events';

import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';
import { mockGameId, mockUsers, gamePlayers } from '../../__mocks__/mockdata';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import MediumManager from '../../src/classes/MediumManager';

describe('test MediumManager', () => {
  const phaseManager = new PhaseManager(
    new EventEmitter(),
    { value: 'running' },
    mockGameId,
  );
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
      expect(() => mediumManager.getMediumResult('villager')).toThrow(
        new AppError(400, errors.AUTH_FAILED),
      );
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'villager',
        'medium',
      );
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      expect(() => mediumManager.getMediumResult('notExist')).toThrow(
        new AppError(400, errors.AUTH_FAILED),
      );
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'notExist',
        'medium',
      );
    });
  });
});
