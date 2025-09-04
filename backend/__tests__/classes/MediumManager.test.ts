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

import MediumManager from '../../src/classes/RoleManager/MediumManager';
import PhaseManager from '../../src/classes/PhaseManager';
import PlayerManager from '../../src/classes/PlayerManager';

describe('MediumManager', () => {
  let mediumManager: MediumManager;
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
        player1: { id: 'player1', role: 'medium', status: 'alive' },
        player2: { id: 'player2', role: 'villager', status: 'alive' },
        player3: { id: 'player3', role: 'werewolf', status: 'alive' },
        deadPlayer: { id: 'deadPlayer', role: 'medium', status: 'dead' },
      },
      validatePlayerByRole: jest.fn(),
      getRandomTarget: jest.fn(),
      getLivingPlayers: jest.fn(),
    } as any;

    mediumManager = new MediumManager(phaseManager, playerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('medium', () => {
    it('霊媒師が生存している場合、霊媒を実行する', () => {
      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      const result = mediumManager.medium('player2');

      expect(result).toBeUndefined();
      expect((mediumManager as any).history[1]).toEqual({
        player2: 'villagers',
      });
    });

    it('霊媒師が死亡している場合、何も実行しない', () => {
      // 死亡している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([]);

      const result = mediumManager.medium('player2');

      expect(result).toBeUndefined();
      expect((mediumManager as any).history[1]).toBeUndefined();
    });

    it('人狼を霊媒した場合、werewolvesとして記録される', () => {
      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      const result = mediumManager.medium('player3');

      expect(result).toBeUndefined();
      expect((mediumManager as any).history[1]).toEqual({
        player3: 'werewolves',
      });
    });

    it('村人を霊媒した場合、villagersとして記録される', () => {
      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      const result = mediumManager.medium('player2');

      expect(result).toBeUndefined();
      expect((mediumManager as any).history[1]).toEqual({
        player2: 'villagers',
      });
    });

    it('霊媒結果が履歴に正しく記録される', () => {
      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 複数日での霊媒をテスト
      mediumManager.medium('player2');

      phaseManager.currentDay = 2;
      mediumManager.medium('player3');

      expect((mediumManager as any).history).toEqual({
        1: { player2: 'villagers' },
        2: { player3: 'werewolves' },
      });
    });

    it('同じ日に複数回霊媒した場合、最新の結果で上書きされる', () => {
      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 同じ日に複数回霊媒
      mediumManager.medium('player2');
      mediumManager.medium('player3');

      expect((mediumManager as any).history[1]).toEqual({
        player3: 'werewolves',
      });
      expect(Object.keys((mediumManager as any).history[1])).toHaveLength(1);
    });
  });

  describe('統合テスト', () => {
    it('完全な霊媒フローのテスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 霊媒を実行
      const result = mediumManager.medium('player2');

      // 結果を確認
      expect(result).toBeUndefined();
      expect((mediumManager as any).history[1]).toEqual({
        player2: 'villagers',
      });
    });

    it('霊媒師死亡時の統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 死亡している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([]);

      // 霊媒を実行
      const result = mediumManager.medium('player2');

      // 結果を確認
      expect(result).toBeUndefined();
      expect((mediumManager as any).history[1]).toBeUndefined();
    });

    it('人狼霊媒の統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 人狼を霊媒
      const result = mediumManager.medium('player3');

      // 結果を確認
      expect(result).toBeUndefined();
      expect((mediumManager as any).history[1]).toEqual({
        player3: 'werewolves',
      });
    });

    it('複数日での霊媒履歴の統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 生存している霊媒師を設定
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue([
        'player1',
      ]);

      // 1日目の霊媒
      mediumManager.medium('player2');

      // 2日目の霊媒
      phaseManager.currentDay = 2;
      mediumManager.medium('player3');

      // 履歴を確認
      expect((mediumManager as any).history).toEqual({
        1: { player2: 'villagers' },
        2: { player3: 'werewolves' },
      });
    });
  });
});
