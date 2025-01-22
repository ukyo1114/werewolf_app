import { ObjectId } from 'mongodb';
import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import { IUser } from '../../src/classes/PlayerManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { random } from 'lodash';

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

describe('test DevineManager', () => {
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

  describe('recieveDevineRequest', () => {
    it('占いリクエストが正しく受け付けられること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;

      phaseManager.nextPhase();
      phaseManager.nextPhase();

      const playerId = game.playerManager.findPlayerByRole('seer').userId;
      const targetId = game.playerManager.findPlayerByRole('villager').userId;

      game.devineManager.receiveDevineRequest(playerId, targetId);

      expect(phaseManager.currentPhase).toBe('night');
      expect(game.devineManager.devineRequest).toBe(targetId);
    });

    it('占いリクエストが不正な場合にエラーが返されること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;

      const playerId = game.playerManager.findPlayerByRole('seer').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;
      const mediumId = game.playerManager.findPlayerByRole('medium').userId;
      const hunterId = game.playerManager.findPlayerByRole('hunter').userId;

      function devineRequest(playerId: string, targetId: string) {
        game.devineManager.receiveDevineRequest(playerId, targetId);
      }

      // preフェーズ
      expect(() => devineRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_FORTUNE),
      );

      phaseManager.nextPhase();

      // dayフェーズ
      expect(() => devineRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_FORTUNE),
      );

      phaseManager.nextPhase();

      // ターゲットが占い師の時
      expect(() => devineRequest(playerId, playerId)).toThrow(
        new AppError(400, gameError.INVALID_FORTUNE),
      );

      game.playerManager.kill(mediumId);

      // ターゲットが死亡しているとき
      expect(game.playerManager.players[mediumId].status).not.toBe('alive');
      expect(() => devineRequest(playerId, mediumId)).toThrow(
        new AppError(400, gameError.INVALID_FORTUNE),
      );

      // 占い師が死亡しているとき
      game.playerManager.kill(playerId);
      expect(game.playerManager.players[playerId].status).not.toBe('alive');
      expect(() => devineRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_FORTUNE),
      );

      // 占い師ではないプレイヤーがリクエストしたとき
      expect(() => devineRequest(villagerId, hunterId)).toThrow(
        new AppError(400, gameError.INVALID_FORTUNE),
      );
    });
  });

  describe('devine', () => {
    it('正しく占い処理が行われ、リクエストがリセットされること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;

      const playerId = game.playerManager.findPlayerByRole('seer').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      phaseManager.nextPhase();
      phaseManager.nextPhase();

      game.devineManager.receiveDevineRequest(playerId, villagerId);
      const devineTargetId = game.devineManager.devine();

      expect(devineTargetId).toBe(villagerId);
      expect(game.devineManager.devineRequest).toBeNull;
    });
  });

  describe('getRandomDevineTarget', () => {
    it('正しいターゲットが設定されること', () => {
      const game = games[mockGameId];
      const playerManager = game.playerManager;

      const villagerId = playerManager.findPlayerByRole('villager').userId;
      const mediumId = playerManager.findPlayerByRole('medium').userId;
      const hunterId = playerManager.findPlayerByRole('hunter').userId;
      const werewolfId = playerManager.findPlayerByRole('werewolf').userId;
      const madmanId = playerManager.findPlayerByRole('madman').userId;

      playerManager.kill(villagerId);
      playerManager.kill(mediumId);
      playerManager.kill(hunterId);
      playerManager.kill(werewolfId);
      playerManager.kill(madmanId);

      for (let i = 0; i < 10; i++) {
        const randomDevineTargetId = game.devineManager.getRandomDevineTarget();
        const randomDevineTarget = playerManager.players[randomDevineTargetId];

        expect(randomDevineTarget.status).toBe('alive');
        expect(randomDevineTarget.role).not.toBe('seer');
      }
    });
  });

  describe('getDevineResult', () => {
    it('占い結果が正しい形式で返されること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;

      const playerId = game.playerManager.findPlayerByRole('seer').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      phaseManager.nextPhase();
      phaseManager.nextPhase();

      game.devineManager.receiveDevineRequest(playerId, villagerId);
      game.devineManager.devine();
      const devineResult = game.devineManager.getDevineResult(playerId);

      expect(devineResult).toEqual({
        1: {
          [villagerId]: 'villagers',
        },
      });
    });

    it('占い結果を不正に取得しようとするとエラーが返されること', () => {
      const game = games[mockGameId];
      const phaseManager = game.phaseManager;

      const playerId = game.playerManager.findPlayerByRole('seer').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      // preフェーズに取得しようとしたとき
      expect(() => game.devineManager.getDevineResult(playerId)).toThrow(
        new AppError(403, gameError.FORTUNE_RESULT_NOT_FOUND),
      );

      phaseManager.nextPhase();
      phaseManager.nextPhase();

      game.devineManager.receiveDevineRequest(playerId, villagerId);
      game.devineManager.devine();

      // 占い以外のプレイヤーが取得しようとしたとき
      expect(() => game.devineManager.getDevineResult(villagerId)).toThrow(
        new AppError(403, gameError.FORTUNE_RESULT_NOT_FOUND),
      );
    });
  });
});
