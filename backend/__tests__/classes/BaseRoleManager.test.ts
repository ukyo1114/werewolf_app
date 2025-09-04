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

import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';
import { BaseRoleManager } from '../../src/classes/RoleManager/BaseRoleManager';
import PhaseManager from '../../src/classes/PhaseManager';
import PlayerManager from '../../src/classes/PlayerManager';
import { Role } from '../../src/classes/classTypes';

// テスト用の具体的な実装クラス
class TestRoleManager extends BaseRoleManager<string[]> {
  protected readonly roleName: Role = 'seer';
  protected request: string | null = null;
  protected history: string[] = [];

  public setRequest(targetId: string | null): void {
    this.request = targetId;
  }

  public setHistory(history: string[]): void {
    this.history = history;
  }

  public testDecideTarget(): string {
    return this.decideTarget();
  }

  public testValidateNightPhase(): void {
    this.validateNightPhase();
  }

  public testValidatePlayer(playerId: string, expectedRole: Role): void {
    this.validatePlayer(playerId, expectedRole);
  }

  public testValidateTarget(targetId: string, excludeRole: Role): void {
    this.validateTarget(targetId, excludeRole);
  }

  public testValidateRequest(
    playerId: string,
    targetId: string,
    expectedRole: Role,
  ): void {
    this.validateRequest(playerId, targetId, expectedRole);
  }

  public testGetLivingPlayers(role: Role): any[] {
    return this.getLivingPlayers(role);
  }

  public testGetRandomTarget(role: Role): string | undefined {
    return this.getRandomTarget(role);
  }

  public testGetCurrentDay(): number {
    return this.getCurrentDay();
  }

  public testGetCurrentPhase(): string {
    return this.getCurrentPhase();
  }
}

describe('BaseRoleManager', () => {
  let baseRoleManager: TestRoleManager;
  let phaseManager: PhaseManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    phaseManager = {
      currentPhase: 'night',
      currentDay: 1,
    } as PhaseManager;

    playerManager = {
      players: {
        player1: { id: 'player1', role: 'seer', status: 'alive' },
        player2: { id: 'player2', role: 'villager', status: 'alive' },
        player3: { id: 'player3', role: 'werewolf', status: 'alive' },
        deadPlayer: { id: 'deadPlayer', role: 'villager', status: 'dead' },
      },
      validatePlayerByRole: jest.fn(),
      getRandomTarget: jest.fn(),
      getLivingPlayers: jest.fn(),
    } as any;

    baseRoleManager = new TestRoleManager(phaseManager, playerManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    it('正しい初期値でインスタンスを作成する', () => {
      expect(baseRoleManager).toBeInstanceOf(TestRoleManager);
      expect(baseRoleManager).toBeInstanceOf(BaseRoleManager);
    });
  });

  describe('receiveRequest', () => {
    it('有効なリクエストを受信する', () => {
      baseRoleManager.receiveRequest('player1', 'player2');

      expect(baseRoleManager['request']).toBe('player2');
    });

    it('無効なリクエストの場合、エラーをスローする', () => {
      phaseManager.currentPhase = 'day';

      expect(() => {
        baseRoleManager.receiveRequest('player1', 'player2');
      }).toThrow(new AppError(400, errors.REQUEST_FAILED));
    });
  });

  describe('getResult', () => {
    it('履歴を返す', () => {
      const testHistory = ['result1', 'result2'];
      baseRoleManager.setHistory(testHistory);

      const result = baseRoleManager.getResult('player1');

      expect(result).toEqual(testHistory);
      expect(playerManager.validatePlayerByRole).toHaveBeenCalledWith(
        'player1',
        'seer',
      );
    });
  });

  describe('decideTarget', () => {
    it('リクエストがある場合、リクエストされたターゲットを返す', () => {
      baseRoleManager.setRequest('player2');
      const target = baseRoleManager.testDecideTarget();

      expect(target).toBe('player2');
      expect(baseRoleManager['request']).toBeNull();
    });

    it('リクエストがない場合、ランダムターゲットを返す', () => {
      const mockRandomTarget = 'player3';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      const target = baseRoleManager.testDecideTarget();

      expect(target).toBe(mockRandomTarget);
      expect(playerManager.getRandomTarget).toHaveBeenCalledWith('seer');
    });
  });

  describe('validateNightPhase', () => {
    it('夜のフェーズの場合、エラーをスローしない', () => {
      phaseManager.currentPhase = 'night';

      expect(() => {
        baseRoleManager.testValidateNightPhase();
      }).not.toThrow();
    });

    it('夜以外のフェーズの場合、エラーをスローする', () => {
      phaseManager.currentPhase = 'day';

      expect(() => {
        baseRoleManager.testValidateNightPhase();
      }).toThrow(AppError);
    });
  });

  describe('validatePlayer', () => {
    it('有効なプレイヤーの場合、エラーをスローしない', () => {
      expect(() => {
        baseRoleManager.testValidatePlayer('player1', 'seer');
      }).not.toThrow();
    });

    it('存在しないプレイヤーの場合、エラーをスローする', () => {
      expect(() => {
        baseRoleManager.testValidatePlayer('nonexistent', 'seer');
      }).toThrow(AppError);
    });

    it('死亡したプレイヤーの場合、エラーをスローする', () => {
      expect(() => {
        baseRoleManager.testValidatePlayer('deadPlayer', 'villager');
      }).toThrow(AppError);
    });

    it('異なる役職のプレイヤーの場合、エラーをスローする', () => {
      expect(() => {
        baseRoleManager.testValidatePlayer('player2', 'seer');
      }).toThrow(AppError);
    });
  });

  describe('validateTarget', () => {
    it('有効なターゲットの場合、エラーをスローしない', () => {
      expect(() => {
        baseRoleManager.testValidateTarget('player2', 'seer');
      }).not.toThrow();
    });

    it('除外役職のターゲットの場合、エラーをスローする', () => {
      expect(() => {
        baseRoleManager.testValidateTarget('player1', 'seer');
      }).toThrow(AppError);
    });

    it('死亡したターゲットの場合、エラーをスローする', () => {
      expect(() => {
        baseRoleManager.testValidateTarget('deadPlayer', 'seer');
      }).toThrow(AppError);
    });
  });

  describe('validateRequest', () => {
    it('有効なリクエストの場合、エラーをスローしない', () => {
      phaseManager.currentPhase = 'night';

      expect(() => {
        baseRoleManager.testValidateRequest('player1', 'player2', 'seer');
      }).not.toThrow();
    });

    it('夜以外のフェーズの場合、エラーをスローする', () => {
      phaseManager.currentPhase = 'day';

      expect(() => {
        baseRoleManager.testValidateRequest('player1', 'player2', 'seer');
      }).toThrow(AppError);
    });

    it('無効なプレイヤーの場合、エラーをスローする', () => {
      phaseManager.currentPhase = 'night';

      expect(() => {
        baseRoleManager.testValidateRequest('player2', 'player1', 'seer');
      }).toThrow(AppError);
    });
  });

  describe('ヘルパーメソッド', () => {
    it('getLivingPlayersを呼び出す', () => {
      const mockLivingPlayers = ['player1', 'player2'];
      (playerManager.getLivingPlayers as jest.Mock).mockReturnValue(
        mockLivingPlayers,
      );

      const result = baseRoleManager.testGetLivingPlayers('seer');

      expect(result).toEqual(mockLivingPlayers);
      expect(playerManager.getLivingPlayers).toHaveBeenCalledWith('seer');
    });

    it('getRandomTargetを呼び出す', () => {
      const mockRandomTarget = 'player3';
      (playerManager.getRandomTarget as jest.Mock).mockReturnValue(
        mockRandomTarget,
      );

      const result = baseRoleManager.testGetRandomTarget('seer');

      expect(result).toBe(mockRandomTarget);
      expect(playerManager.getRandomTarget).toHaveBeenCalledWith('seer');
    });

    it('getCurrentDayを呼び出す', () => {
      const result = baseRoleManager.testGetCurrentDay();

      expect(result).toBe(1);
    });

    it('getCurrentPhaseを呼び出す', () => {
      const result = baseRoleManager.testGetCurrentPhase();

      expect(result).toBe('night');
    });
  });

  describe('統合テスト', () => {
    it('完全なリクエストフローをテストする', () => {
      // 夜のフェーズに設定
      phaseManager.currentPhase = 'night';

      // リクエストを受信
      baseRoleManager.receiveRequest('player1', 'player2');

      // リクエストが正しく設定されていることを確認
      expect(baseRoleManager['request']).toBe('player2');

      // ターゲットを決定
      const target = baseRoleManager.testDecideTarget();

      // ターゲットが正しく返されることを確認
      expect(target).toBe('player2');

      // リクエストがクリアされることを確認
      expect(baseRoleManager['request']).toBeNull();
    });

    it('エラーケースの統合テスト', () => {
      // 昼のフェーズに設定
      phaseManager.currentPhase = 'day';

      // 無効なフェーズでリクエストを試行
      expect(() => {
        baseRoleManager.receiveRequest('player1', 'player2');
      }).toThrow(AppError);

      // リクエストが設定されていないことを確認
      expect(baseRoleManager['request']).toBeNull();
    });
  });
});
