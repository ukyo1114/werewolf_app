jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import { EventEmitter } from 'events';

import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import GuardManager from '../../src/classes/GuardManager';
import { mockGameId, mockUsers, gamePlayers } from '../../__mocks__/mockdata';

describe('test GuardManager', () => {
  const phaseManager = new PhaseManager(
    new EventEmitter(),
    { value: 'running' },
    mockGameId,
  );
  const playerManager = new PlayerManager(mockGameId, mockUsers);
  const guardManager = new GuardManager(phaseManager, playerManager);

  beforeEach(() => {
    playerManager.players = gamePlayers();
    guardManager.guardHistory = {};
    jest.clearAllMocks();
  });

  afterAll(() => {
    const timerId = phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    jest.restoreAllMocks();
  });

  describe('recieveGuardRequest', () => {
    it('nightフェーズで狩人が生存プレイヤーを護衛対象として指定できる', () => {
      phaseManager.currentPhase = 'night';
      guardManager.receiveGuradRequest('hunter', 'villager');
      expect(guardManager.guardRequest).toBe('villager');
    });

    it('nightフェーズ以外では護衛リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'day';
      expect(() =>
        guardManager.receiveGuradRequest('hunter', 'villager'),
      ).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });

    it('死亡した狩人からの護衛リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'night';
      playerManager.players.hunter.status = 'dead';

      expect(() =>
        guardManager.receiveGuradRequest('hunter', 'villager'),
      ).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });

    it('狩人以外の役職からの護衛リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        guardManager.receiveGuradRequest('villager', 'villager'),
      ).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });

    it('死亡したプレイヤーを護衛対象として指定できない', () => {
      phaseManager.currentPhase = 'night';
      playerManager.players.villager.status = 'dead';

      expect(playerManager.players.villager.status).not.toBe('alive');
      expect(() =>
        guardManager.receiveGuradRequest('hunter', 'villager'),
      ).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });

    it('狩人自身を護衛対象として指定できない', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        guardManager.receiveGuradRequest('hunter', 'hunter'),
      ).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });

    it('存在しないプレイヤーからの護衛リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        guardManager.receiveGuradRequest('notExist', 'villager'),
      ).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });

    it('存在しないプレイヤーを護衛対象として指定できない', () => {
      phaseManager.currentPhase = 'night';

      expect(() =>
        guardManager.receiveGuradRequest('hunter', 'notExist'),
      ).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });
  });

  describe('decideGuardTarget', () => {
    const getRandomTargetSpy = jest.spyOn(playerManager, 'getRandomTarget');

    beforeEach(() => {
      getRandomTargetSpy.mockClear();
    });

    it('護衛リクエストが存在する場合、そのリクエストを護衛対象として決定する', () => {
      guardManager.guardRequest = 'testRequest';
      const guardTarget = guardManager.decideGuardTarget();

      expect(guardTarget).toBe('testRequest');
      expect(guardManager.guardRequest).toBeNull;
      expect(guardManager.guardHistory[0]).toBe('testRequest');
      expect(getRandomTargetSpy).not.toHaveBeenCalled();
    });

    it('護衛リクエストが存在しない場合、ランダムな護衛対象を決定する', () => {
      guardManager.guardRequest = null;

      const guardTarget = guardManager.decideGuardTarget();
      expect(guardTarget).toBeDefined;
      expect(guardManager.guardRequest).toBeNull;
      expect(guardManager.guardHistory[0]).toBeDefined;
      expect(getRandomTargetSpy).toHaveBeenCalled();
    });

    it('護衛リクエストが存在せず、getRandomTargetがundefinedを返す場合、undefinedを返す', () => {
      guardManager.guardRequest = null;
      getRandomTargetSpy.mockReturnValue(undefined);

      const guardTarget = guardManager.decideGuardTarget();
      expect(guardTarget).toBeUndefined();
      expect(guardManager.guardRequest).toBeNull();
      expect(guardManager.guardHistory[0]).toBeUndefined();
      expect(getRandomTargetSpy).toHaveBeenCalledWith('hunter');
    });
  });

  describe('guard', () => {
    const decideGuardTargetSpy = jest.spyOn(guardManager, 'decideGuardTarget');

    it('護衛対象が正しい場合、護衛は成功する', () => {
      guardManager.guardRequest = 'villager';

      expect(guardManager.guard()).toBe('villager');
      expect(guardManager.guardRequest).toBeNull;
      expect(guardManager.guardHistory[0]).toBe('villager');
      expect(decideGuardTargetSpy).toHaveBeenCalled();
    });

    it('狩人が生存していない場合、undefinedを返す', () => {
      const getLivingPlayersSpy = jest.spyOn(playerManager, 'getLivingPlayers');
      getLivingPlayersSpy.mockReturnValue([]);

      const result = guardManager.guard();
      expect(result).toBeUndefined();
      expect(guardManager.guardRequest).toBeNull();
      expect(getLivingPlayersSpy).toHaveBeenCalledWith('hunter');
      expect(decideGuardTargetSpy).not.toHaveBeenCalled();
    });

    it('decideGuardTargetがundefinedを返す場合、undefinedを返す', () => {
      const getLivingPlayersSpy = jest.spyOn(playerManager, 'getLivingPlayers');
      getLivingPlayersSpy.mockReturnValue([
        {
          userId: 'hunter',
          userName: 'hunter',
          role: 'hunter',
          status: 'alive',
          teammates: [],
        },
      ]);
      decideGuardTargetSpy.mockReturnValue(undefined);

      const result = guardManager.guard();
      expect(result).toBeUndefined();
      expect(getLivingPlayersSpy).toHaveBeenCalledWith('hunter');
      expect(decideGuardTargetSpy).toHaveBeenCalled();
    });
  });

  describe('getGuardHistory', () => {
    const validatePlayerByRoleSpy = jest.spyOn(
      playerManager,
      'validatePlayerByRole',
    );

    beforeEach(() => {
      validatePlayerByRoleSpy.mockClear();
    });

    it('狩人は護衛履歴を取得できる', () => {
      guardManager.guardHistory = { 0: 'villager' };

      const guardHistory = guardManager.getGuardHistory('hunter');
      expect(guardHistory).toEqual({ 0: 'villager' });
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith('hunter', 'hunter');
    });

    it('狩人以外の役職は護衛履歴を取得できない', () => {
      expect(() => guardManager.getGuardHistory('villager')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'villager',
        'hunter',
      );
    });

    it('存在しないプレイヤーは護衛履歴を取得できない', () => {
      expect(() => guardManager.getGuardHistory('notExist')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'notExist',
        'hunter',
      );
    });
  });
});
