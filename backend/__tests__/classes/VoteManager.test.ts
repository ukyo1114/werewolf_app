jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import AppError from '../../src/utils/AppError';
import VoteManager from '../../src/classes/VoteManager';
import PhaseManager from '../../src/classes/PhaseManager';
import PlayerManager from '../../src/classes/PlayerManager';

describe('VoteManager', () => {
  let voteManager: VoteManager;
  let phaseManager: PhaseManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    phaseManager = {
      currentPhase: 'day',
      currentDay: 1,
    } as PhaseManager;

    playerManager = {
      players: {
        player1: { id: 'player1', role: 'villager', status: 'alive' },
        player2: { id: 'player2', role: 'werewolf', status: 'alive' },
        player3: { id: 'player3', role: 'seer', status: 'alive' },
        deadPlayer: { id: 'deadPlayer', role: 'villager', status: 'dead' },
      },
    } as any;

    voteManager = new VoteManager(phaseManager, playerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('正しい初期値でインスタンスを作成する', () => {
      expect(voteManager).toBeInstanceOf(VoteManager);
      expect(voteManager.voteHistory).toEqual({});
    });
  });

  describe('receiveVote', () => {
    it('昼のフェーズで有効な投票を受信する', () => {
      phaseManager.currentPhase = 'day';

      voteManager.receiveVote('player1', 'player2');

      // 投票が正しく記録されることを確認（protectedプロパティなので型アサーションを使用）
      expect((voteManager as any).votes['player1']).toBe('player2');
    });

    it('自分自身への投票でエラーをスローする', () => {
      phaseManager.currentPhase = 'day';

      expect(() => {
        voteManager.receiveVote('player1', 'player1');
      }).toThrow(AppError);
    });

    it('夜のフェーズで投票を試行するとエラーをスローする', () => {
      phaseManager.currentPhase = 'night';

      expect(() => {
        voteManager.receiveVote('player1', 'player2');
      }).toThrow(AppError);
    });

    it('死亡した投票者でエラーをスローする', () => {
      phaseManager.currentPhase = 'day';

      expect(() => {
        voteManager.receiveVote('deadPlayer', 'player2');
      }).toThrow(AppError);
    });

    it('死亡した投票対象でエラーをスローする', () => {
      phaseManager.currentPhase = 'day';

      expect(() => {
        voteManager.receiveVote('player1', 'deadPlayer');
      }).toThrow(AppError);
    });

    it('同じ投票者の投票を上書きする', () => {
      phaseManager.currentPhase = 'day';

      // 最初の投票
      voteManager.receiveVote('player1', 'player2');
      expect((voteManager as any).votes['player1']).toBe('player2');

      // 2回目の投票（上書き）
      voteManager.receiveVote('player1', 'player3');
      expect((voteManager as any).votes['player1']).toBe('player3');
    });

    it('複数の投票者からの投票を処理する', () => {
      phaseManager.currentPhase = 'day';

      voteManager.receiveVote('player1', 'player2');
      voteManager.receiveVote('player3', 'player2');

      expect((voteManager as any).votes['player1']).toBe('player2');
      expect((voteManager as any).votes['player3']).toBe('player2');
    });
  });

  describe('getExecutionTarget', () => {
    it('最多得票者を処刑対象として返す', () => {
      phaseManager.currentPhase = 'day';

      // 投票を設定
      (voteManager as any).votes = {
        player1: 'player2',
        player3: 'player2',
      };

      const executionTarget = voteManager.getExecutionTarget();

      expect(executionTarget).toBe('player2');
      // 投票履歴が記録されることを確認
      expect(voteManager.voteHistory[1]).toBeDefined();
      // 投票がリセットされることを確認
      expect((voteManager as any).votes).toEqual({});
    });

    it('同点の場合はランダムに選択する', () => {
      phaseManager.currentPhase = 'day';

      // 同点の投票を設定
      (voteManager as any).votes = {
        player1: 'player2',
        player3: 'player1',
      };

      const executionTarget = voteManager.getExecutionTarget();

      expect(['player1', 'player2']).toContain(executionTarget);
      expect(voteManager.voteHistory[1]).toBeDefined();
      expect((voteManager as any).votes).toEqual({});
    });

    it('投票がない場合はundefinedを返す', () => {
      phaseManager.currentPhase = 'day';

      (voteManager as any).votes = {};

      const executionTarget = voteManager.getExecutionTarget();

      expect(executionTarget).toBeUndefined();
      expect(voteManager.voteHistory[1]).toBeDefined();
      expect((voteManager as any).votes).toEqual({});
    });
  });

  describe('logVoteHistory', () => {
    it('投票履歴が正しい形式で記録される', () => {
      phaseManager.currentPhase = 'day';
      phaseManager.currentDay = 1;

      // 複数の投票を設定
      (voteManager as any).votes = {
        player1: 'player2',
        player3: 'player2',
      };

      voteManager.getExecutionTarget();

      // 投票履歴の確認
      expect(voteManager.voteHistory[1]).toEqual({
        player2: ['player1', 'player3'],
      });
    });

    it('複数日での投票履歴が正しく記録される', () => {
      // 1日目の投票
      phaseManager.currentPhase = 'day';
      phaseManager.currentDay = 1;
      (voteManager as any).votes = { player1: 'player2' };
      voteManager.getExecutionTarget();

      // 2日目の投票
      phaseManager.currentDay = 2;
      (voteManager as any).votes = { player3: 'player1' };
      voteManager.getExecutionTarget();

      // 履歴の確認
      expect(voteManager.voteHistory[1]).toEqual({ player2: ['player1'] });
      expect(voteManager.voteHistory[2]).toEqual({ player1: ['player3'] });
    });

    it('投票後に投票がリセットされる', () => {
      phaseManager.currentPhase = 'day';

      (voteManager as any).votes = { player1: 'player2' };

      voteManager.getExecutionTarget();

      expect((voteManager as any).votes).toEqual({});
    });
  });

  describe('統合テスト', () => {
    it('完全な投票フローのテスト', () => {
      // 昼のフェーズに設定
      phaseManager.currentPhase = 'day';
      phaseManager.currentDay = 1;

      // 複数の投票を受信
      voteManager.receiveVote('player1', 'player2');
      voteManager.receiveVote('player3', 'player2');

      // 処刑対象を決定
      const executionTarget = voteManager.getExecutionTarget();

      // 結果の確認
      expect(executionTarget).toBe('player2');
      expect(voteManager.voteHistory[1]).toEqual({
        player2: ['player1', 'player3'],
      });
      expect((voteManager as any).votes).toEqual({});
    });

    it('同点投票の統合テスト', () => {
      // 昼のフェーズに設定
      phaseManager.currentPhase = 'day';
      phaseManager.currentDay = 1;

      // 同点の投票を受信
      voteManager.receiveVote('player1', 'player2');
      voteManager.receiveVote('player3', 'player1');

      // 処刑対象を決定
      const executionTarget = voteManager.getExecutionTarget();

      // 結果の確認
      expect(['player1', 'player2']).toContain(executionTarget);
      expect(voteManager.voteHistory[1]).toBeDefined();
      expect((voteManager as any).votes).toEqual({});
    });

    it('エラーケースの統合テスト', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // 無効なフェーズで投票を試行
      expect(() => {
        voteManager.receiveVote('player1', 'player2');
      }).toThrow(AppError);

      // 投票が記録されていないことを確認
      expect((voteManager as any).votes).toEqual({});
    });
  });
});
