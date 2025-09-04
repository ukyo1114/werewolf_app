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

import DevineManager from '../../src/classes/RoleManager/DevineManager';
import PhaseManager from '../../src/classes/PhaseManager';
import PlayerManager from '../../src/classes/PlayerManager';

describe('DevineManager', () => {
  let devineManager: DevineManager;
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
        player1: { id: 'player1', role: 'seer', status: 'alive' },
        player2: { id: 'player2', role: 'villager', status: 'alive' },
        player3: { id: 'player3', role: 'werewolf', status: 'alive' },
        player4: { id: 'player4', role: 'fox', status: 'alive' },
        deadPlayer: { id: 'deadPlayer', role: 'seer', status: 'dead' },
      },
      validatePlayerByRole: jest.fn(),
      getRandomTarget: jest.fn(),
      getLivingPlayers: jest.fn(),
    } as any;

    devineManager = new DevineManager(phaseManager, playerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('devine', () => {
    it('占い師が生存している場合、占いを実行する', () => {
      // 生存している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // リクエストを設定
      (devineManager as any).request = 'player2';

      const result = devineManager.devine();

      expect(result).toBeUndefined(); // キツネでないため
      expect((devineManager as any).history[1]).toEqual({
        player2: 'villagers',
      });
      expect((devineManager as any).request).toBeNull();
    });

    it('占い師が死亡している場合、undefinedを返す', () => {
      // 死亡している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([]);

      const result = devineManager.devine();

      expect(result).toBeUndefined();
      expect((devineManager as any).request).toBeNull();
    });

    it('人狼を占った場合、werewolvesとして記録される', () => {
      // 生存している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 人狼へのリクエストを設定
      (devineManager as any).request = 'player3';

      const result = devineManager.devine();

      expect(result).toBeUndefined(); // キツネでないため
      expect((devineManager as any).history[1]).toEqual({
        player3: 'werewolves',
      });
    });

    it('キツネを占った場合、キツネのIDを返す', () => {
      // 生存している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // キツネへのリクエストを設定
      (devineManager as any).request = 'player4';

      const result = devineManager.devine();

      expect(result).toBe('player4');
      expect((devineManager as any).history[1]).toEqual({
        player4: 'villagers',
      });
    });

    it('リクエストがない場合、ランダムターゲットを使用する', () => {
      // 生存している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      const mockRandomTarget = 'player2';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      const result = devineManager.devine();

      expect(result).toBeUndefined();
      expect(playerManager.getRandomTarget).toHaveBeenCalledWith('seer');
      expect((devineManager as any).history[1]).toEqual({
        player2: 'villagers',
      });
    });

    it('占い結果が履歴に正しく記録される', () => {
      // 生存している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 複数日での占いをテスト
      (devineManager as any).request = 'player2';
      devineManager.devine();

      phaseManager.currentDay = 2;
      (devineManager as any).request = 'player3';
      devineManager.devine();

      expect((devineManager as any).history).toEqual({
        1: { player2: 'villagers' },
        2: { player3: 'werewolves' },
      });
    });
  });

  describe('統合テスト', () => {
    it('完全な占いフローのテスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 生存している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // リクエストを受信
      devineManager.receiveRequest('player1', 'player2');

      // 占いを実行
      const result = devineManager.devine();

      // 結果を確認
      expect(result).toBeUndefined();
      expect((devineManager as any).history[1]).toEqual({
        player2: 'villagers',
      });
    });

    it('キツネ占いの統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 生存している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // キツネへのリクエストを受信
      devineManager.receiveRequest('player1', 'player4');

      // 占いを実行
      const result = devineManager.devine();

      // 結果を確認
      expect(result).toBe('player4');
      expect((devineManager as any).history[1]).toEqual({
        player4: 'villagers',
      });
    });

    it('占い師死亡時の統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 死亡している占い師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([]);

      // リクエストを受信
      devineManager.receiveRequest('player1', 'player2');

      // 占いを実行
      const result = devineManager.devine();

      // 結果を確認
      expect(result).toBeUndefined();
      expect((devineManager as any).request).toBeNull();
    });
  });
});
