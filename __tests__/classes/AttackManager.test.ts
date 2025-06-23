jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import GameUser from '../../src/models/GameUser';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import GuardManager from '../../src/classes/GuardManager';
import AttackManager from '../../src/classes/AttackManager';
import { mockGameId, mockUsers } from '../../__mocks__/mockdata';
import { gamePlayers } from '../../__mocks__/mockdata';
import { EventEmitter } from 'events';

describe('test AttackManager', () => {
  GameUser.updateOne = jest.fn();
  const phaseManager = new PhaseManager(
    new EventEmitter(),
    {
      value: 'running',
    },
    mockGameId,
  );
  const playerManager = new PlayerManager(mockGameId, mockUsers);
  const guardManager = new GuardManager(phaseManager, playerManager);
  const attackManager = new AttackManager(
    phaseManager,
    playerManager,
    guardManager,
  );

  beforeEach(() => {
    playerManager.players = gamePlayers();
  });

  afterAll(() => {
    const timerId = phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    jest.restoreAllMocks();
  });

  describe('receiveAttackRequest', () => {
    it('nightフェーズで人狼が生存プレイヤーを襲撃対象として指定できる', () => {
      phaseManager.currentPhase = 'night';
      attackManager.receiveAttackRequest('werewolf', 'villager');
      expect(attackManager.attackRequest).toBe('villager');
    });

    it('nightフェーズ以外では襲撃リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'day';
      expect(() =>
        attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('死亡した人狼からの襲撃リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'night';
      playerManager.players.werewolf.status = 'dead';
      expect(() =>
        attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('人狼以外の役職からの襲撃リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'night';
      expect(() =>
        attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('死亡したプレイヤーを襲撃対象として指定できない', () => {
      phaseManager.currentPhase = 'night';
      playerManager.players.villager.status = 'dead';
      expect(() =>
        attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('人狼を襲撃対象として指定できない', () => {
      phaseManager.currentPhase = 'night';
      expect(() =>
        attackManager.receiveAttackRequest('werewolf', 'werewolf'),
      ).toThrow();
    });

    it('存在しないプレイヤーからの襲撃リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'night';
      expect(() =>
        attackManager.receiveAttackRequest('notExist', 'villager'),
      ).toThrow();
    });

    it('存在しないプレイヤーを襲撃対象として指定できない', () => {
      phaseManager.currentPhase = 'night';
      expect(() =>
        attackManager.receiveAttackRequest('werewolf', 'notExist'),
      ).toThrow();
    });

    it('同じ人狼からの複数回のリクエストは最新のリクエストで上書きされる', () => {
      phaseManager.currentPhase = 'night';
      attackManager.receiveAttackRequest('werewolf', 'villager');
      attackManager.receiveAttackRequest('werewolf', 'seer');
      expect(attackManager.attackRequest).toBe('seer');
    });

    it('異なる人狼からのリクエストは最新のリクエストで上書きされる', () => {
      phaseManager.currentPhase = 'night';
      attackManager.receiveAttackRequest('werewolf', 'villager');
      attackManager.receiveAttackRequest('werewolf2', 'seer');
      expect(attackManager.attackRequest).toBe('seer');
    });

    it('preフェーズでは襲撃リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'pre';
      expect(() =>
        attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('finishedフェーズでは襲撃リクエストを受け付けない', () => {
      phaseManager.currentPhase = 'finished';
      expect(() =>
        attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('狐を襲撃対象として指定できる', () => {
      phaseManager.currentPhase = 'night';
      attackManager.receiveAttackRequest('werewolf', 'fox');
      expect(attackManager.attackRequest).toBe('fox');
    });

    it('狩人を襲撃対象として指定できる', () => {
      phaseManager.currentPhase = 'night';
      attackManager.receiveAttackRequest('werewolf', 'hunter');
      expect(attackManager.attackRequest).toBe('hunter');
    });

    it('占い師を襲撃対象として指定できる', () => {
      phaseManager.currentPhase = 'night';
      attackManager.receiveAttackRequest('werewolf', 'seer');
      expect(attackManager.attackRequest).toBe('seer');
    });
  });

  describe('decideAttackTarget', () => {
    it('襲撃リクエストが存在する場合、そのリクエストを攻撃対象として決定する', () => {
      attackManager.attackRequest = 'testRequest';
      const attackRequest = attackManager.decideAttackTarget();
      expect(attackManager.attackRequest).toBeNull();
      expect(attackRequest).toBe('testRequest');
    });

    it('襲撃リクエストが存在しない場合、ランダムな攻撃対象を決定する', () => {
      attackManager.attackRequest = null;
      const attackTarget = attackManager.decideAttackTarget();
      expect(attackTarget).toBeDefined();
    });

    it('襲撃リクエストが存在する場合、その日の攻撃履歴に記録される', () => {
      phaseManager.currentDay = 1;
      attackManager.attackRequest = 'villager';
      const attackTarget = attackManager.decideAttackTarget();
      expect(attackManager.attackHistory[1]).toBe('villager');
    });

    it('襲撃リクエストが存在しない場合、その日の攻撃履歴にランダムなターゲットが記録される', () => {
      phaseManager.currentDay = 2;
      attackManager.attackRequest = null;
      const attackTarget = attackManager.decideAttackTarget();
      expect(attackManager.attackHistory[2]).toBeDefined();
      expect(attackManager.attackHistory[2]).not.toBe('werewolf');
    });

    it('襲撃リクエストが存在する場合、既存の攻撃履歴は保持される', () => {
      phaseManager.currentDay = 3;
      attackManager.attackHistory = { 1: 'villager', 2: 'seer' };
      attackManager.attackRequest = 'hunter';
      const attackTarget = attackManager.decideAttackTarget();
      expect(attackManager.attackHistory).toEqual({
        1: 'villager',
        2: 'seer',
        3: 'hunter',
      });
    });

    it('襲撃リクエストが存在しない場合、既存の攻撃履歴は保持される', () => {
      phaseManager.currentDay = 4;
      attackManager.attackHistory = { 1: 'villager', 2: 'seer', 3: 'hunter' };
      attackManager.attackRequest = null;
      const attackTarget = attackManager.decideAttackTarget();
      expect(attackManager.attackHistory[1]).toBe('villager');
      expect(attackManager.attackHistory[2]).toBe('seer');
      expect(attackManager.attackHistory[3]).toBe('hunter');
      expect(attackManager.attackHistory[4]).toBeDefined();
    });

    it('襲撃リクエストが存在する場合、決定後にリクエストはnullにリセットされる', () => {
      attackManager.attackRequest = 'villager';
      attackManager.decideAttackTarget();
      expect(attackManager.attackRequest).toBeNull();
    });

    it('襲撃リクエストが存在しない場合、決定後もリクエストはnullのままである', () => {
      attackManager.attackRequest = null;
      attackManager.decideAttackTarget();
      expect(attackManager.attackRequest).toBeNull();
    });

    it('襲撃リクエストが存在する場合、決定された攻撃対象はリクエストと一致する', () => {
      attackManager.attackRequest = 'villager';
      const attackTarget = attackManager.decideAttackTarget();
      expect(attackTarget).toBe('villager');
    });

    it('襲撃リクエストが存在しない場合、決定された攻撃対象は人狼以外の生存プレイヤーである', () => {
      attackManager.attackRequest = null;
      const attackTarget = attackManager.decideAttackTarget();
      const target = playerManager.players[attackTarget];
      expect(target).toBeDefined();
      expect(target.status).toBe('alive');
      expect(target.role).not.toBe('werewolf');
    });
  });

  describe('attack', () => {
    const guardSpy = jest.spyOn(guardManager, 'guard');

    beforeAll(() => {
      phaseManager.currentDay = 0;
      attackManager.attackHistory = {};
    });

    beforeEach(() => {
      guardSpy.mockClear();
    });

    it('襲撃が成功し、対象プレイヤーが死亡する', async () => {
      guardSpy.mockReturnValueOnce(false);
      phaseManager.currentPhase = 'night';
      attackManager.attackRequest = 'villager';

      const attackTarget = await attackManager.attack();
      expect(attackTarget).toBe('villager');
      expect(playerManager.players.villager.status).toBe('dead');
      expect(attackManager.attackRequest).toBeNull();
      expect(attackManager.attackHistory).toEqual({ 0: 'villager' });
      expect(guardSpy).toHaveBeenCalledWith('villager');
    });

    it('護衛が成功した場合、襲撃は失敗し対象プレイヤーは生存する', async () => {
      guardSpy.mockReturnValueOnce(true);
      phaseManager.currentPhase = 'night';
      attackManager.attackRequest = 'villager';

      const attackTarget = await attackManager.attack();
      expect(attackTarget).toBe(undefined);
      expect(playerManager.players.villager.status).toBe('alive');
      expect(attackManager.attackRequest).toBeNull();
      expect(attackManager.attackHistory).toEqual({ 0: 'villager' });
      expect(guardSpy).toHaveBeenCalledWith('villager');
    });

    it('狐への襲撃は失敗し、対象プレイヤーは生存する', async () => {
      guardSpy.mockReturnValueOnce(false);
      phaseManager.currentPhase = 'night';
      attackManager.attackRequest = 'fox';

      const attackTarget = await attackManager.attack();
      expect(attackTarget).toBe(undefined);
      expect(playerManager.players.fox.status).toBe('alive');
      expect(attackManager.attackRequest).toBeNull();
      expect(attackManager.attackHistory).toEqual({ 0: 'fox' });
      expect(guardSpy).not.toHaveBeenCalled();
    });

    it('狩人が死亡している場合、護衛は実行されず襲撃は成功する', async () => {
      phaseManager.currentPhase = 'night';
      playerManager.players.hunter.status = 'dead';
      attackManager.attackRequest = 'villager';

      const attackTarget = await attackManager.attack();
      expect(attackTarget).toBe('villager');
      expect(playerManager.players.villager.status).toBe('dead');
      expect(attackManager.attackRequest).toBeNull();
      expect(attackManager.attackHistory).toEqual({ 0: 'villager' });
      expect(guardSpy).not.toHaveBeenCalled();
    });
  });

  describe('getAttackHistory', () => {
    const validatePlayerByRoleSpy = jest.spyOn(
      playerManager,
      'validatePlayerByRole',
    );

    beforeAll(() => {
      attackManager.attackHistory = { 1: 'villager' };
    });

    afterEach(() => {
      validatePlayerByRoleSpy.mockClear();
    });

    it('人狼は襲撃履歴を取得できる', () => {
      const attackHistory = attackManager.getAttackHistory('werewolf');
      expect(attackHistory).toEqual({ 1: 'villager' });
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'werewolf',
        'werewolf',
      );
    });

    it('人狼以外の役職は襲撃履歴を取得できない', () => {
      expect(playerManager.players.villager).toBeDefined();
      expect(() => attackManager.getAttackHistory('villager')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'villager',
        'werewolf',
      );
    });

    it('存在しないプレイヤーは襲撃履歴を取得できない', () => {
      expect(() => attackManager.getAttackHistory('notExist')).toThrow();
      expect(validatePlayerByRoleSpy).toHaveBeenCalledWith(
        'notExist',
        'werewolf',
      );
    });
  });
});
