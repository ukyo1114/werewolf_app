jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
}));
import GameManager from '../../src/classes/GameManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

describe('test GuardManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
    // sendMessageをモック
    gameManagers[mockGameId].sendMessage = jest.fn();
  });

  afterAll(() => {
    delete gameManagers[mockGameId];
    jest.restoreAllMocks();
  });

  describe('recieveGuardRequest', () => {
    it('護衛リクエストが正しく受け付けられること', () => {
      const game = gameManagers[mockGameId];
      const phaseManager = game.phaseManager;

      phaseManager.nextPhase();
      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('night');

      const playerId = game.playerManager.findPlayerByRole('hunter').userId;
      const targetId = game.playerManager.findPlayerByRole('villager').userId;

      game.guardManager.receiveGuradRequest(playerId, targetId);

      expect(game.guardManager.guardRequest).toBe(targetId);
    });

    it('護衛リクエストが不正な場合にエラーが返されること', () => {
      const game = gameManagers[mockGameId];
      const phaseManager = game.phaseManager;

      const playerId = game.playerManager.findPlayerByRole('hunter').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;
      const seerId = game.playerManager.findPlayerByRole('seer').userId;
      const mediumId = game.playerManager.findPlayerByRole('medium').userId;

      function guardRequest(playerId: string, targetId: string) {
        game.guardManager.receiveGuradRequest(playerId, targetId);
      }

      // preフェーズ
      expect(phaseManager.currentPhase).toBe('pre');
      expect(() => guardRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_GUARD),
      );

      phaseManager.nextPhase();

      // dayフェーズ
      expect(phaseManager.currentPhase).toBe('day');
      expect(() => guardRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_GUARD),
      );

      phaseManager.nextPhase();

      // ターゲットが狩人の時
      expect(() => guardRequest(playerId, playerId)).toThrow(
        new AppError(400, gameError.INVALID_GUARD),
      );

      game.playerManager.kill(seerId);

      // ターゲットが死亡しているとき
      expect(game.playerManager.players[seerId].status).not.toBe('alive');
      expect(() => guardRequest(playerId, seerId)).toThrow(
        new AppError(400, gameError.INVALID_GUARD),
      );

      // 狩人が死亡しているとき
      game.playerManager.kill(playerId);
      expect(game.playerManager.players[playerId].status).not.toBe('alive');
      expect(() => guardRequest(playerId, villagerId)).toThrow(
        new AppError(400, gameError.INVALID_GUARD),
      );

      // 占い師ではないプレイヤーがリクエストしたとき
      expect(() => guardRequest(villagerId, mediumId)).toThrow(
        new AppError(400, gameError.INVALID_GUARD),
      );
    });
  });

  describe('devine', () => {
    it('正しく護衛処理が行われ、リクエストがリセットされること', () => {
      const game = gameManagers[mockGameId];
      const guardManager = game.guardManager;

      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      guardManager.guardRequest = villagerId;

      const result = guardManager.guard(villagerId);

      expect(result).toBe(true);
      expect(guardManager.guardRequest).toBe(null);
    });
  });

  describe('getRandomDevineTarget', () => {
    it('正しいターゲットが設定されること', () => {
      const game = gameManagers[mockGameId];
      const playerManager = game.playerManager;

      const villagerId = playerManager.findPlayerByRole('villager').userId;
      const seerId = game.playerManager.findPlayerByRole('seer').userId;
      const mediumId = playerManager.findPlayerByRole('medium').userId;
      const werewolfId = playerManager.findPlayerByRole('werewolf').userId;
      const madmanId = playerManager.findPlayerByRole('madman').userId;

      playerManager.kill(villagerId);
      playerManager.kill(seerId);
      playerManager.kill(mediumId);
      playerManager.kill(werewolfId);
      playerManager.kill(madmanId);

      for (let i = 0; i < 10; i++) {
        const randomDevineTargetId = game.guardManager.getRandomGuardTarget();
        const randomDevineTarget = playerManager.players[randomDevineTargetId];

        expect(randomDevineTarget.status).toBe('alive');
        expect(randomDevineTarget.role).not.toBe('hunter');
      }
    });
  });

  describe('getGuardHistory', () => {
    it('護衛結果が正しい形式で返されること', () => {
      const game = gameManagers[mockGameId];
      const phaseManager = game.phaseManager;
      const guardManager = game.guardManager;

      const playerId = game.playerManager.findPlayerByRole('hunter').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      phaseManager.nextPhase();
      phaseManager.nextPhase();

      guardManager.guardRequest = villagerId;
      guardManager.guard(villagerId);

      const guardHistory = guardManager.getGuardHistory(playerId);

      expect(phaseManager.currentPhase).toBe('night');
      expect(guardHistory).toEqual({
        1: villagerId,
      });
    });

    it('護衛結果を不正に取得しようとするとエラーが返されること', () => {
      const game = gameManagers[mockGameId];
      const phaseManager = game.phaseManager;
      const guardManager = game.guardManager;

      const playerId = game.playerManager.findPlayerByRole('hunter').userId;
      const villagerId = game.playerManager.findPlayerByRole('villager').userId;

      // preフェーズに取得しようとしたとき
      expect(() => guardManager.getGuardHistory(playerId)).toThrow(
        new AppError(403, gameError.GUARD_HISTORY_NOT_FOUND),
      );

      phaseManager.nextPhase();
      phaseManager.nextPhase();

      // 占い以外のプレイヤーが取得しようとしたとき
      expect(phaseManager.currentPhase).toBe('night');
      expect(() => guardManager.getGuardHistory(villagerId)).toThrow(
        new AppError(403, gameError.GUARD_HISTORY_NOT_FOUND),
      );
    });
  });
});
