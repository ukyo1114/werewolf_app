import { ObjectId } from 'mongodb';
import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import { IUser } from '../../src/classes/PlayerManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';

const mockChannelId = 'mockChannelId';
const mockGameId = new ObjectId().toString();
const mockUsers: IUser[] = [
  { userId: new ObjectId().toString(), userName: 'Alice' },
  { userId: new ObjectId().toString(), userName: 'Bob' },
  { userId: new ObjectId().toString(), userName: 'Charlie' },
  { userId: new ObjectId().toString(), userName: 'Diana' },
  { userId: new ObjectId().toString(), userName: 'Eve' },
  { userId: new ObjectId().toString(), userName: 'Frank' },
  { userId: new ObjectId().toString(), userName: 'Grace' },
  { userId: new ObjectId().toString(), userName: 'Hank' },
  { userId: new ObjectId().toString(), userName: 'Ivy' },
  { userId: new ObjectId().toString(), userName: 'Jack' },
];

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
    it('襲撃リクエストが正しく受け付けられること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;
      const attackManager = game.attackManager;

      phaseManager.nextPhase();
      phaseManager.nextPhase();

      const playerId = game.playerManager.findPlayerByRole('werewolf').userId;
      const targetId = game.playerManager.findPlayerByRole('villager').userId;

      attackManager.receiveAttackRequest(playerId, targetId);

      expect(phaseManager.currentPhase).toBe('night');
      expect(attackManager.attackRequest).toBe(targetId);
    });

    it('襲撃リクエストが不正な場合にエラーが返されること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;
      const attackManager = game.attackManager;

      const playerId = game.playerManager.findPlayerByRole('werewolf').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;
      const seerId = game.playerManager.findPlayerByRole('seer').userId;
      const mediumId = game.playerManager.findPlayerByRole('medium').userId;

      function attackRequest(playerId: string, targetId: string) {
        attackManager.receiveAttackRequest(playerId, targetId);
      }

      // preフェーズ
      expect(phaseManager.currentPhase).toBe('pre');
      expect(() => attackRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_ATTACK),
      );

      phaseManager.nextPhase();

      // dayフェーズ
      expect(phaseManager.currentPhase).toBe('day');
      expect(() => attackRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_ATTACK),
      );

      phaseManager.nextPhase();

      // ターゲットが人狼の時
      expect(phaseManager.currentPhase).toBe('night');
      expect(() => attackRequest(playerId, playerId)).toThrow(
        new AppError(400, gameError.INVALID_ATTACK),
      );

      game.playerManager.kill(mediumId);

      // ターゲットが死亡しているとき
      expect(game.playerManager.players[mediumId].status).not.toBe('alive');
      expect(() => attackRequest(playerId, mediumId)).toThrow(
        new AppError(400, gameError.INVALID_ATTACK),
      );

      // 人狼が死亡しているとき
      game.playerManager.kill(playerId);
      expect(game.playerManager.players[playerId].status).not.toBe('alive');
      expect(() => attackRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_ATTACK),
      );

      // 人狼ではないプレイヤーがリクエストしたとき
      expect(game.playerManager.players[villagerId].status).toBe('alive');
      expect(game.playerManager.players[seerId].status).toBe('alive');
      expect(() => attackRequest(villagerId, seerId)).toThrow(
        new AppError(400, gameError.INVALID_ATTACK),
      );
    });
  });

  describe('attack', () => {
    it('正しく襲撃処理が行われ、リクエストがリセットされること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;
      const attackManager = game.attackManager;
      game.guardManager.guard = jest.fn().mockReturnValue(false);

      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      phaseManager.nextPhase();
      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('night');

      attackManager.attackRequest = villagerId;
      const attackTargetId = attackManager.attack();

      expect(attackTargetId).toBe(villagerId);
      expect(game.playerManager.players[villagerId].status).not.toBe('alive');
      expect(attackManager.attackRequest).toBe(null);
    });

    it('護衛成功時の処理が正しく行われること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;
      const attackManager = game.attackManager;
      game.guardManager.guard = jest.fn().mockReturnValue(true);

      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      phaseManager.nextPhase();
      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('night');

      attackManager.attackRequest = villagerId;
      const attackTargetId = attackManager.attack();

      expect(attackTargetId).toBe(null);
      expect(game.playerManager.players[villagerId].status).toBe('alive');
      expect(attackManager.attackRequest).toBe(null);
    });
  });

  describe('getRandomAttackTarget', () => {
    it('正しいターゲットが設定されること', () => {
      const game = games[mockGameId];
      const playerManager = game.playerManager;
      const attackManager = game.attackManager;

      const villagerId = playerManager.findPlayerByRole('villager').userId;
      const seerId = playerManager.findPlayerByRole('seer').userId;
      const mediumId = playerManager.findPlayerByRole('medium').userId;
      const hunterId = playerManager.findPlayerByRole('hunter').userId;
      const madmanId = playerManager.findPlayerByRole('madman').userId;

      playerManager.kill(villagerId);
      playerManager.kill(seerId);
      playerManager.kill(mediumId);
      playerManager.kill(hunterId);
      playerManager.kill(madmanId);

      for (let i = 0; i < 10; i++) {
        const randomAttackTargetId = attackManager.getRandomAttackTarget();
        const randomAttackTarget = playerManager.players[randomAttackTargetId];

        expect(randomAttackTarget.status).toBe('alive');
        expect(randomAttackTarget.role).not.toBe('werewolf');
      }
    });
  });

  describe('getAttackHistory', () => {
    it('襲撃履歴が正しい形式で返されること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;
      const attackManager = game.attackManager;
      game.guardManager.guard = jest.fn().mockReturnValue(false);

      const playerId = game.playerManager.findPlayerByRole('werewolf').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      phaseManager.nextPhase();
      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('night');

      attackManager.attackRequest = villagerId;
      attackManager.attack();

      const attackHistory = attackManager.getAttackHistory(playerId);

      expect(attackHistory).toEqual({
        1: villagerId,
      });
    });

    it('襲撃履歴を不正に取得しようとするとエラーが返されること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;
      const attackManager = game.attackManager;

      const playerId = game.playerManager.findPlayerByRole('werewolf').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      // preフェーズに取得しようとしたとき
      expect(() => attackManager.getAttackHistory(playerId)).toThrow(
        new AppError(403, gameError.ATTACK_HISTORY_NOT_FOUND),
      );

      phaseManager.nextPhase();
      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('night');

      // 人狼以外のプレイヤーが取得しようとしたとき
      expect(() => attackManager.getAttackHistory(villagerId)).toThrow(
        new AppError(403, gameError.ATTACK_HISTORY_NOT_FOUND),
      );
    });
  });
});
