/**
 * Test create AttackManager instance
 * An instance created
 *
 * Test receiveAttackRequest
 * The request is accepted correctly
 * Returns an error in the following cases:
 * - The phase is not night
 * - The requesting player is not a werewolf or is not alive
 * - The target player is a werewolf or is not alive
 *
 * Test Attack
 * The attack is succesful
 * If the requested target does not exist, a randomly selected target is attacked
 * If the guard is successful, the attack fails
 * If the target is a fox, the attack fails
 *
 */
import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';

describe('test AttackManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    games[mockGameId] = new GameManager(mockChannelId, mockGameId, mockUsers);
    // sendMessageをモック
    games[mockGameId].sendMessage = jest.fn();
  });

  afterAll(() => {
    delete games[mockGameId];
    jest.restoreAllMocks();
  });

  describe('recieveAttackRequest', () => {
    it('リクエストが受け付けられる', () => {
      const game = games[mockGameId];
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

      game.attackManager.receiveAttackRequest('werewolf', 'villager');

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(game.attackManager.attackRequest).toBe('villager');
    });

    it('nightフェーズでないときエラーを返す', () => {
      const game = games[mockGameId];
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
      ).toThrow(new AppError(400, gameError.INVALID_ATTACK));
    });

    it('リクエストを送信したプレイヤーが死亡しているときエラーを返す', () => {
      const game = games[mockGameId];
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
      ).toThrow(new AppError(400, gameError.INVALID_ATTACK));
    });

    it('リクエストを送信したプレイヤーが人狼でないときエラーを返す', () => {
      const game = games[mockGameId];
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
      ).toThrow(new AppError(400, gameError.INVALID_ATTACK));
    });

    it('ターゲットが死亡しているときエラーを返す', () => {
      const game = games[mockGameId];
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
      ).toThrow(new AppError(400, gameError.INVALID_ATTACK));
    });

    it('ターゲットが人狼のときエラーを返す', () => {
      const game = games[mockGameId];
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
      ).toThrow(new AppError(400, gameError.INVALID_ATTACK));
    });

    it('リクエストを送信したプレイヤーが存在しないときエラーを返す', () => {
      const game = games[mockGameId];
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
      ).toThrow(new AppError(400, gameError.INVALID_ATTACK));
    });

    it('ターゲットが存在しないときエラーを返す', () => {
      const game = games[mockGameId];
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
          'werewolf',
          'nonExistingPlayer',
        ),
      ).toThrow(new AppError(400, gameError.INVALID_ATTACK));
    });
  });

  describe('attack', () => {
    it('襲撃が行われる', () => {
      const game = games[mockGameId];
      game.phaseManager.currentDay = 1;
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
      game.guardManager.guard = jest.fn().mockReturnValue(false);

      expect(game.phaseManager.currentPhase).toBe('night');

      game.attackManager.attackRequest = 'villager';

      const attackTargetId = game.attackManager.attack();

      expect(attackTargetId).toBe('villager');
      expect(game.playerManager.players.villager.status).toBe('dead');
      expect(game.attackManager.attackRequest).toBe(null);
      expect(game.attackManager.attackHistory).toEqual({ 1: 'villager' });
    });

    it('護衛成功時の処理が正しく行われる', () => {
      const game = games[mockGameId];
      game.phaseManager.currentDay = 1;
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
      game.guardManager.guard = jest.fn().mockReturnValue(true);

      expect(game.phaseManager.currentPhase).toBe('night');

      game.attackManager.attackRequest = 'villager';
      const attackTargetId = game.attackManager.attack();

      expect(attackTargetId).toBe(null);
      expect(game.playerManager.players.villager.status).toBe('alive');
      expect(game.attackManager.attackRequest).toBe(null);
      expect(game.attackManager.attackHistory).toEqual({ 1: 'villager' });
    });

    it('襲撃対象が狐だった場合襲撃が失敗する', () => {
      const game = games[mockGameId];
      game.phaseManager.currentDay = 1;
      game.phaseManager.currentPhase = 'night';
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

      expect(attackTargetId).toBe(null);
      expect(game.playerManager.players.fox.status).toBe('alive');
      expect(game.attackManager.attackRequest).toBe(null);
      expect(game.attackManager.attackHistory).toEqual({ 1: 'fox' });
    });

    it('狩人が死亡している場合護衛が実行されない', () => {
      const game = games[mockGameId];
      game.phaseManager.currentDay = 1;
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
      expect(game.attackManager.attackRequest).toBe(null);
      expect(game.attackManager.attackHistory).toEqual({ 1: 'villager' });
    });
  });

  describe('getRandomAttackTarget', () => {
    it('正しいターゲットが設定されること', () => {
      const game = games[mockGameId];
      game.playerManager.players = {
        user1: {
          userId: 'user1',
          userName: 'user1',
          status: 'alive',
          role: 'villager',
        },
        user2: {
          userId: 'user2',
          userName: 'user2',
          status: 'alive',
          role: 'seer',
        },
        user3: {
          userId: 'user3',
          userName: 'user3',
          status: 'alive',
          role: 'werewolf',
        },
        user4: {
          userId: 'user4',
          userName: 'user4',
          status: 'dead',
          role: 'villager',
        },
      };

      for (let i = 0; i < 1000; i++) {
        const target = game.attackManager.getRandomAttackTarget();

        expect(['user1', 'user2']).toContain(target);
      }
    });
  });

  describe('getAttackHistory', () => {
    it('襲撃履歴を取得できる', () => {
      const game = games[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
      };

      expect(game.phaseManager.currentPhase).not.toBe('pre');

      game.attackManager.attackHistory = { 1: 'villager' };

      const attackHistory = game.attackManager.getAttackHistory('werewolf');

      expect(attackHistory).toEqual({
        1: 'villager',
      });
    });

    it('プレイヤーが人狼でないときエラーを返す', () => {
      const game = games[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.playerManager.players = {
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).not.toBe('pre');

      expect(() => game.attackManager.getAttackHistory('villager')).toThrow(
        new AppError(403, gameError.ATTACK_HISTORY_NOT_FOUND),
      );
    });

    it('preフェーズのときエラーを返す', () => {
      const game = games[mockGameId];
      game.playerManager.players = {
        werewolf: {
          userId: 'werewolf',
          userName: 'werewof',
          status: 'alive',
          role: 'werewolf',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('pre');

      expect(() => game.attackManager.getAttackHistory('werewolf')).toThrow(
        new AppError(403, gameError.ATTACK_HISTORY_NOT_FOUND),
      );
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = games[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.playerManager.players = {};

      expect(game.phaseManager.currentPhase).not.toBe('pre');
      expect(game.playerManager.players.werewolf).toBeUndefined;

      expect(() => game.attackManager.getAttackHistory('werewolf')).toThrow(
        new AppError(403, gameError.ATTACK_HISTORY_NOT_FOUND),
      );
    });
  });
});
