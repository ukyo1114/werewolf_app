jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
}));
import GameManager from '../../src/classes/GameManager';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

describe('test AttackManager', () => {
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

  describe('recieveAttackRequest', () => {
    it('リクエストが受け付けられる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      game.attackManager.receiveAttackRequest('werewolf', 'villager');
      expect(game.attackManager.attackRequest).toBe('villager');
    });

    it('nightフェーズでないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).not.toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'dead',
          role: 'werewolf',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが人狼でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        villager1: {
          userId: 'villager1',
          userName: 'villager1',
          status: 'alive',
          role: 'villager',
        },
        villager2: {
          userId: 'villager2',
          userName: 'villager2',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(game.playerManager.players.villager1.role).not.toBe('werewolf');
      expect(() =>
        game.attackManager.receiveAttackRequest('villager1', 'villager2'),
      ).toThrow();
    });

    it('ターゲットが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'dead',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(game.playerManager.players.villager.status).not.toBe('alive');
      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('ターゲットが人狼のときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        werewolf1: {
          userId: 'werewolf1',
          userName: 'werewof1',
          status: 'alive',
          role: 'werewolf',
        },
        werewolf2: {
          userId: 'werewolf2',
          userName: 'werewof2',
          status: 'alive',
          role: 'werewolf',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf1', 'werewolf2'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest(
          'nonExistingPlayer',
          'villager',
        ),
      ).toThrow();
    });

    it('ターゲットが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'notExist'),
      ).toThrow();
    });
  });

  describe('decideAttackTarget', () => {
    it('リクエストが存在するとき', () => {
      const game = gameManagers[mockGameId];
      game.attackManager.attackRequest = 'testRequest';
      const attackRequest = game.attackManager.decideAttackTarget();

      expect(game.attackManager.attackRequest).toBeNull;
      expect(attackRequest).toBe('testRequest');
    });

    it('リクエストが存在しないとき', () => {
      const game = gameManagers[mockGameId];
      game.attackManager.attackRequest = null;

      const attackTarget = game.attackManager.decideAttackTarget();
      expect(attackTarget).toBe('villager');
    });
  });

  describe('attack', () => {
    it('襲撃が行われる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
        },
      };
      game.attackManager.attackRequest = 'villager';
      game.guardManager.guard = jest.fn().mockReturnValue(false);

      expect(game.phaseManager.currentPhase).toBe('night');
      const attackTargetId = game.attackManager.attack();

      expect(attackTargetId).toBe('villager');
      expect(game.playerManager.players.villager.status).toBe('dead');
      expect(game.attackManager.attackRequest).toBeNull;
      expect(game.attackManager.attackHistory).toEqual({ 0: 'villager' });
    });

    it('護衛成功時の処理が正しく行われる', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
        },
      };
      game.guardManager.guard = jest.fn().mockReturnValue(true);
      expect(game.phaseManager.currentPhase).toBe('night');

      game.attackManager.attackRequest = 'villager';
      const attackTargetId = game.attackManager.attack();

      expect(attackTargetId).toBeNull;
      expect(game.playerManager.players.villager.status).toBe('alive');
      expect(game.attackManager.attackRequest).toBeNull;
      expect(game.attackManager.attackHistory).toEqual({ 0: 'villager' });
    });

    it('襲撃対象が狐だった場合襲撃が失敗する', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        fox: {
          userId: 'fox',
          userName: 'fox',
          status: 'alive',
          role: 'fox',
        },
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
        },
      };
      game.guardManager.guard = jest.fn().mockReturnValue(false);

      expect(game.phaseManager.currentPhase).toBe('night');

      game.attackManager.attackRequest = 'fox';
      const attackTargetId = game.attackManager.attack();

      expect(attackTargetId).toBeNull;
      expect(game.playerManager.players.fox.status).toBe('alive');
      expect(game.attackManager.attackRequest).toBe(null);
      expect(game.attackManager.attackHistory).toEqual({ 0: 'fox' });
    });

    it('狩人が死亡している場合護衛が実行されない', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'dead',
          role: 'hunter',
        },
      };
      game.guardManager.guard = jest.fn().mockReturnValue(true);

      expect(game.phaseManager.currentPhase).toBe('night');

      game.attackManager.attackRequest = 'villager';
      const attackTargetId = game.attackManager.attack();

      expect(attackTargetId).toBe('villager');
      expect(game.playerManager.players.villager.status).toBe('dead');
      expect(game.attackManager.attackRequest).toBeNull;
      expect(game.attackManager.attackHistory).toEqual({ 0: 'villager' });
    });
  });

  describe('getAttackHistory', () => {
    it('襲撃履歴を取得できる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
      };
      game.attackManager.attackHistory = { 1: 'villager' };

      const attackHistory = game.attackManager.getAttackHistory('werewolf');
      expect(attackHistory).toEqual({ 1: 'villager' });
    });

    it('プレイヤーが人狼でないときエラーを返す', () => {
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
      expect(() => game.attackManager.getAttackHistory('villager')).toThrow();
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.playerManager.players.werewolf).toBeUndefined();
      expect(() => game.attackManager.getAttackHistory('werewolf')).toThrow();
    });
  });
});
