jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import { mockGameId, mockUsers } from '../../__mocks__/mockdata';
import { gamePlayers } from '../../__mocks__/mockdata';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import DevineManager from '../../src/classes/DevineManager';
import EventEmitter from 'events';

describe('test DevineManager', () => {
  const phaseManager = new PhaseManager(
    new EventEmitter(),
    { value: 'running' },
    mockGameId,
  );
  const playerManager = new PlayerManager(mockGameId, mockUsers);
  const devineManager = new DevineManager(phaseManager, playerManager);

  beforeEach(() => {
    playerManager.players = gamePlayers();
  });

  afterAll(() => {
    const timerId = phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    jest.restoreAllMocks();
  });

  describe('recieveDevineRequest', () => {
    it('リクエストが受け付けられる', () => {
      phaseManager.currentPhase = 'night';

      devineManager.receiveDevineRequest('seer', 'villager');
      expect(devineManager.devineRequest).toBe('villager');
    });

    it('nightフェーズでないときエラーを返す', () => {
      phaseManager.currentPhase = 'day';

      expect(() =>
        devineManager.receiveDevineRequest('seer', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが死亡しているときエラーを返す', () => {
      phaseManager.currentPhase = 'night';
      playerManager.players.seer.status = 'dead';

      expect(() =>
        devineManager.receiveDevineRequest('seer', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが占い師でないときエラーを返す', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        devineManager.receiveDevineRequest('villager', 'villager'),
      ).toThrow();
    });

    it('ターゲットが死亡しているときエラーを返す', () => {
      phaseManager.currentPhase = 'night';
      playerManager.players.villager.status = 'dead';

      expect(playerManager.players.villager.status).not.toBe('alive');
      expect(() =>
        devineManager.receiveDevineRequest('seer', 'villager'),
      ).toThrow();
    });

    it('ターゲットが占い師のときエラーを返す', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        devineManager.receiveDevineRequest('seer', 'seer'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが存在しないときエラーを返す', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        devineManager.receiveDevineRequest('notExist', 'villager'),
      ).toThrow();
    });

    it('ターゲットが存在しないときエラーを返す', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        devineManager.receiveDevineRequest('werewolf', 'notExist'),
      ).toThrow();
    });
  });

  describe('decideDevineTarget', () => {
    const getRandomTargetSpy = jest.spyOn(playerManager, 'getRandomTarget');

    beforeEach(() => {
      getRandomTargetSpy.mockClear();
    });

    it('リクエストが存在するとき', () => {
      devineManager.devineRequest = 'testRequest';
      const devineTarget = devineManager.decideDevineTarget();
      expect(devineTarget).toBe('testRequest');
      expect(getRandomTargetSpy).not.toHaveBeenCalled();
    });

    it('リクエストが存在しないとき', () => {
      devineManager.devineRequest = null;

      const devineTarget = devineManager.decideDevineTarget();
      expect(devineTarget).toBeDefined();
      expect(getRandomTargetSpy).toHaveBeenCalled();
    });
  });

  describe('devine', () => {
    const getLivingPlayersSpy = jest.spyOn(playerManager, 'getLivingPlayers');
    const decideDevineTargetSpy = jest.spyOn(
      devineManager,
      'decideDevineTarget',
    );

    beforeEach(() => {
      getLivingPlayersSpy.mockClear();
      decideDevineTargetSpy.mockClear();
    });

    it('占いが行われる', () => {
      devineManager.devineRequest = 'villager';

      expect(devineManager.devine()).toBe(false);
      expect(devineManager.devineRequest).toBe(null);
      expect(devineManager.devineResult[0]).toEqual({
        villager: 'villagers',
      });
      expect(getLivingPlayersSpy).toHaveBeenCalledWith('seer');
      expect(decideDevineTargetSpy).toHaveBeenCalled();
    });

    it('妖狐を占ったとき', () => {
      devineManager.devineRequest = 'fox';

      expect(devineManager.devine()).toBe(true);
      expect(devineManager.devineRequest).toBe(null);
      expect(devineManager.devineResult[0]).toEqual({
        fox: 'villagers',
      });
      expect(getLivingPlayersSpy).toHaveBeenCalledWith('seer');
      expect(decideDevineTargetSpy).toHaveBeenCalled();
    });

    it('占い師が死亡しているとき', () => {
      devineManager.devineResult = {};
      playerManager.players.seer.status = 'dead';
      devineManager.devineRequest = 'villager';

      expect(devineManager.devine()).toBe(false);
      expect(devineManager.devineRequest).toBe(null);
      expect(devineManager.devineResult).not.toHaveProperty('0');
      expect(getLivingPlayersSpy).toHaveBeenCalledWith('seer');
      expect(decideDevineTargetSpy).not.toHaveBeenCalled();
    });
  });

  describe('getDevineResult', () => {
    const validatePlayerByRoleSpy = jest.spyOn(
      playerManager,
      'validatePlayerByRole',
    );

    beforeEach(() => {
      validatePlayerByRoleSpy.mockClear();
    });

    it('占い結果が正しい形式で返されること', () => {
      devineManager.devineResult = { 0: { villager: 'villagers' } };

      const devineResult = devineManager.getDevineResult('seer');
      expect(devineResult).toEqual({
        0: { villager: 'villagers' },
      });
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith('seer', 'seer');
    });

    it('プレイヤーが占いでないときエラーを返す', () => {
      expect(() => devineManager.getDevineResult('villager')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith('villager', 'seer');
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      expect(() => devineManager.getDevineResult('notExist')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith('notExist', 'seer');
    });
  });
});
