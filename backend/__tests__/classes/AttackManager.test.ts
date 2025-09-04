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

import AttackManager from '../../src/classes/RoleManager/AttackManager';
import PhaseManager from '../../src/classes/PhaseManager';
import PlayerManager from '../../src/classes/PlayerManager';

describe('AttackManager', () => {
  let attackManager: AttackManager;
  let phaseManager: PhaseManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    phaseManager = {
      currentPhase: 'night',
      currentDay: 1,
    } as PhaseManager;

    playerManager = {
      players: {
        player1: { id: 'player1', role: 'werewolf', status: 'alive' },
        player2: { id: 'player2', role: 'villager', status: 'alive' },
        player3: { id: 'player3', role: 'fox', status: 'alive' },
        deadPlayer: { id: 'deadPlayer', role: 'villager', status: 'dead' },
      },
      validatePlayerByRole: jest.fn(),
      getRandomTarget: jest.fn(),
      getLivingPlayers: jest.fn(),
    } as any;

    attackManager = new AttackManager(phaseManager, playerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('attack', () => {
    it('通常のターゲットを攻撃する', () => {
      (attackManager as any).request = 'player2';

      const result = attackManager.attack();

      expect(result).toBe('player2');
      expect((attackManager as any).history[1]).toBe('player2');
    });

    it('妖狐をターゲットにした場合、undefinedを返す', () => {
      (attackManager as any).request = 'player3';

      const result = attackManager.attack();

      expect(result).toBeUndefined();
      expect((attackManager as any).history[1]).toBe('player3');
    });

    it('リクエストがない場合、ランダムターゲットを使用する', () => {
      const mockRandomTarget = 'player2';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      const result = attackManager.attack();

      expect(result).toBe(mockRandomTarget);
      expect(playerManager.getRandomTarget).toHaveBeenCalledWith('werewolf');
      expect((attackManager as any).history[1]).toBe(mockRandomTarget);
    });
  });

  describe('isTargetFox', () => {
    it('ターゲットがキツネの場合、trueを返す', () => {
      const result = (attackManager as any).isTargetFox('player3');
      expect(result).toBe(true);
    });

    it('ターゲットがキツネでない場合、falseを返す', () => {
      const result = (attackManager as any).isTargetFox('player2');
      expect(result).toBe(false);
    });
  });

  describe('decideTarget', () => {
    it('リクエストがある場合、リクエストされたターゲットを返す', () => {
      (attackManager as any).request = 'player2';

      const result = (attackManager as any).decideTarget();

      expect(result).toBe('player2');
      expect((attackManager as any).history[1]).toBe('player2');
      expect((attackManager as any).request).toBeNull();
    });

    it('リクエストがない場合、ランダムターゲットを返す', () => {
      const mockRandomTarget = 'player2';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      const result = (attackManager as any).decideTarget();

      expect(result).toBe(mockRandomTarget);
      expect((attackManager as any).history[1]).toBe(mockRandomTarget);
    });
  });

  describe('統合テスト', () => {
    it('攻撃フローの完全なテスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // リクエストを受信
      attackManager.receiveRequest('player1', 'player2');

      // 攻撃を実行
      const result = attackManager.attack();

      // 結果を確認
      expect(result).toBe('player2');
      expect((attackManager as any).history[1]).toBe('player2');
    });

    it('キツネ攻撃の統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // キツネへのリクエストを受信
      attackManager.receiveRequest('player1', 'player3');

      // 攻撃を実行
      const result = attackManager.attack();

      // 結果を確認
      expect(result).toBeUndefined();
      expect((attackManager as any).history[1]).toBe('player3');
    });
  });
});
