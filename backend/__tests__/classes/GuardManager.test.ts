import { EventEmitter } from 'events';

// モックの設定
jest.mock('../../src/app', () => ({
  appState: {
    gameManagers: {},
    entryManagers: {},
  },
  Events: {
    entryEvents: new EventEmitter(),
    channelEvents: new EventEmitter(),
  },
}));

import GuardManager from '../../src/classes/RoleManager/GuardManager';
import PhaseManager from '../../src/classes/PhaseManager';
import PlayerManager from '../../src/classes/PlayerManager';

describe('GuardManager', () => {
  let guardManager: GuardManager;
  let phaseManager: PhaseManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    // PhaseManagerとPlayerManagerのモック
    phaseManager = {
      currentPhase: 'night',
      currentDay: 1,
    } as PhaseManager;

    playerManager = {
      players: {
        player1: { id: 'player1', role: 'hunter', status: 'alive' },
        player2: { id: 'player2', role: 'villager', status: 'alive' },
        player3: { id: 'player3', role: 'werewolf', status: 'alive' },
        deadPlayer: { id: 'deadPlayer', role: 'hunter', status: 'dead' },
      },
      validatePlayerByRole: jest.fn(),
      getRandomTarget: jest.fn(),
      getLivingPlayers: jest.fn(),
    } as any;

    guardManager = new GuardManager(phaseManager, playerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('guard', () => {
    it('狩人が生存している場合、護衛を実行する', () => {
      // 生存している狩人を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // リクエストを設定
      (guardManager as any).request = 'player2';

      const result = guardManager.guard();

      expect(result).toBe('player2');
      expect((guardManager as any).history[1]).toBe('player2');
    });

    it('狩人が死亡している場合、undefinedを返す', () => {
      // 死亡している狩人を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([]);

      const result = guardManager.guard();

      expect(result).toBeUndefined();
    });

    it('リクエストがない場合、ランダムターゲットを使用する', () => {
      // 生存している狩人を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      const mockRandomTarget = 'player2';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      const result = guardManager.guard();

      expect(result).toBe(mockRandomTarget);
      expect(playerManager.getRandomTarget).toHaveBeenCalledWith('hunter');
      expect((guardManager as any).history[1]).toBe(mockRandomTarget);
    });

    it('護衛履歴が正しく記録される', () => {
      // 生存している狩人を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 複数日での護衛をテスト
      (guardManager as any).request = 'player2';
      guardManager.guard();

      phaseManager.currentDay = 2;
      (guardManager as any).request = 'player3';
      guardManager.guard();

      expect((guardManager as any).history).toEqual({
        1: 'player2',
        2: 'player3',
      });
    });
  });

  describe('decideTarget', () => {
    it('リクエストがある場合、リクエストされたターゲットを返す', () => {
      (guardManager as any).request = 'player2';

      const result = (guardManager as any).decideTarget();

      expect(result).toBe('player2');
      expect((guardManager as any).history[1]).toBe('player2');
      expect((guardManager as any).request).toBeNull();
    });

    it('リクエストがない場合、ランダムターゲットを返す', () => {
      const mockRandomTarget = 'player2';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      const result = (guardManager as any).decideTarget();

      expect(result).toBe(mockRandomTarget);
      expect((guardManager as any).history[1]).toBe(mockRandomTarget);
    });
  });

  describe('統合テスト', () => {
    it('完全な護衛フローのテスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 生存している狩人を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // リクエストを受信
      guardManager.receiveRequest('player1', 'player2');

      // 護衛を実行
      const result = guardManager.guard();

      // 結果を確認
      expect(result).toBe('player2');
      expect((guardManager as any).history[1]).toBe('player2');
    });

    it('狩人死亡時の統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 死亡している狩人を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([]);

      // リクエストを受信
      guardManager.receiveRequest('player1', 'player2');

      // 護衛を実行
      const result = guardManager.guard();

      // 結果を確認
      expect(result).toBeUndefined();
    });

    it('ランダム護衛の統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 生存している狩人を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      const mockRandomTarget = 'player2';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      // 護衛を実行（リクエストなし）
      const result = guardManager.guard();

      // 結果を確認
      expect(result).toBe(mockRandomTarget);
      expect((guardManager as any).history[1]).toBe(mockRandomTarget);
    });
  });
});
