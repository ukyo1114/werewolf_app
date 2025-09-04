import PhaseManager from '../../src/classes/PhaseManager';
import { CurrentPhase } from '../../src/config/types';

describe('PhaseManager', () => {
  let phaseManager: PhaseManager;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    phaseManager = new PhaseManager();
    mockCallback = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    it('正しい初期値でインスタンスを作成する', () => {
      expect(phaseManager).toBeInstanceOf(PhaseManager);
      expect(phaseManager.currentDay).toBe(0);
      expect(phaseManager.currentPhase).toBe('pre');
      expect(phaseManager.changedAt).toBeInstanceOf(Date);
    });

    it('フェーズの持続時間が正しく設定される', () => {
      expect(phaseManager.phaseDurations_sec).toEqual({
        pre: 30,
        day: 10 * 60,
        night: 3 * 60,
        finished: 10 * 60,
      });
    });
  });

  describe('startTimer', () => {
    it('現在のフェーズに応じたタイマーを開始する', () => {
      phaseManager.currentPhase = 'day';
      phaseManager.startTimer(mockCallback);

      // タイマーが開始されたことを確認（コールバックが実行されるまで待機）
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('夜のフェーズでタイマーを開始する', () => {
      phaseManager.currentPhase = 'night';
      phaseManager.startTimer(mockCallback);

      // タイマーが開始されたことを確認
      jest.advanceTimersByTime(3 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('準備フェーズでタイマーを開始する', () => {
      phaseManager.currentPhase = 'pre';
      phaseManager.startTimer(mockCallback);

      // タイマーが開始されたことを確認
      jest.advanceTimersByTime(30 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('既存のタイマーをキャンセルしてから新しいタイマーを開始する', () => {
      phaseManager.currentPhase = 'day';

      // 最初のタイマーを開始
      phaseManager.startTimer(mockCallback);

      // 2回目のタイマーを開始（既存のタイマーをキャンセル）
      phaseManager.startTimer(mockCallback);

      // 新しいタイマーが動作することを確認
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1); // 1回だけ実行される
    });
  });

  describe('cancelTimer', () => {
    it('アクティブなタイマーをキャンセルする', () => {
      phaseManager.currentPhase = 'day';
      phaseManager.startTimer(mockCallback);

      phaseManager.cancelTimer();

      // タイマーがキャンセルされたことを確認
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('タイマーがない場合は何もしない', () => {
      // タイマーがない状態でキャンセルを試行
      phaseManager.cancelTimer();

      // エラーが発生しないことを確認
      expect(phaseManager.currentPhase).toBe('pre');
    });

    it('タイマーキャンセル後にタイマーIDがnullになる', () => {
      phaseManager.currentPhase = 'day';
      phaseManager.startTimer(mockCallback);

      phaseManager.cancelTimer();

      // タイマーIDがnullになることを確認（protectedプロパティなので型アサーションを使用）
      expect((phaseManager as any).timerId).toBeNull();
    });
  });

  describe('switchPhase', () => {
    it('昼のフェーズに切り替える', () => {
      const initialDay = phaseManager.currentDay;

      phaseManager.switchPhase('day', mockCallback);

      expect(phaseManager.currentPhase).toBe('day');
      expect(phaseManager.currentDay).toBe(initialDay + 1);
      expect(phaseManager.changedAt).toBeInstanceOf(Date);

      // タイマーが開始されたことを確認
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('夜のフェーズに切り替える', () => {
      const initialDay = phaseManager.currentDay;

      phaseManager.switchPhase('night', mockCallback);

      expect(phaseManager.currentPhase).toBe('night');
      expect(phaseManager.currentDay).toBe(initialDay); // 夜のフェーズでは日数は増加しない
      expect(phaseManager.changedAt).toBeInstanceOf(Date);

      // タイマーが開始されたことを確認
      jest.advanceTimersByTime(3 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('準備フェーズに切り替える', () => {
      phaseManager.switchPhase('pre', mockCallback);

      expect(phaseManager.currentPhase).toBe('pre');
      expect(phaseManager.currentDay).toBe(0); // 準備フェーズでは日数は増加しない
      expect(phaseManager.changedAt).toBeInstanceOf(Date);

      // タイマーが開始されたことを確認
      jest.advanceTimersByTime(30 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('終了フェーズに切り替える', () => {
      phaseManager.switchPhase('finished', mockCallback);

      expect(phaseManager.currentPhase).toBe('finished');
      expect(phaseManager.currentDay).toBe(0); // 終了フェーズでは日数は増加しない
      expect(phaseManager.changedAt).toBeInstanceOf(Date);

      // タイマーが開始されたことを確認
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('フェーズ切り替え時に既存のタイマーをキャンセルする', () => {
      phaseManager.currentPhase = 'day';
      phaseManager.startTimer(mockCallback);

      // フェーズを切り替え（既存タイマーをキャンセルして新しいタイマー開始）
      phaseManager.switchPhase('night', mockCallback);

      // 既存のタイマーがキャンセルされたことを確認
      // 新しいタイマーが開始されているため、時間を進めるとコールバックが実行される
      jest.advanceTimersByTime(3 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // 昼のフェーズの時間を進めてもコールバックが実行されないことを確認
      jest.advanceTimersByTime(7 * 60 * 1000); // 残り7分
      expect(mockCallback).toHaveBeenCalledTimes(1); // 1回のまま
    });
  });

  describe('タイマーの動作', () => {
    it('タイマー終了時にコールバックが実行される', () => {
      phaseManager.currentPhase = 'day';
      phaseManager.startTimer(mockCallback);

      // タイマーを進める
      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('タイマーキャンセル後にコールバックが実行されない', () => {
      phaseManager.currentPhase = 'day';
      phaseManager.startTimer(mockCallback);

      // タイマーをキャンセル
      phaseManager.cancelTimer();

      // タイマーを進める
      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('統合テスト', () => {
    it('完全なフェーズ遷移のテスト', () => {
      // 準備フェーズから開始
      expect(phaseManager.currentPhase).toBe('pre');
      expect(phaseManager.currentDay).toBe(0);

      // 昼のフェーズに切り替え
      phaseManager.switchPhase('day', mockCallback);
      expect(phaseManager.currentPhase).toBe('day');
      expect(phaseManager.currentDay).toBe(1);

      // 夜のフェーズに切り替え
      phaseManager.switchPhase('night', mockCallback);
      expect(phaseManager.currentPhase).toBe('night');
      expect(phaseManager.currentDay).toBe(1); // 日数は増加しない

      // 次の昼のフェーズに切り替え
      phaseManager.switchPhase('day', mockCallback);
      expect(phaseManager.currentPhase).toBe('day');
      expect(phaseManager.currentDay).toBe(2);
    });

    it('タイマー管理の統合テスト', () => {
      // 昼のフェーズでタイマー開始
      phaseManager.switchPhase('day', mockCallback);

      // 夜のフェーズに切り替え（既存タイマーをキャンセルして新しいタイマー開始）
      phaseManager.switchPhase('night', mockCallback);

      // 既存のタイマーがキャンセルされたことを確認
      // 新しいタイマーが開始されているため、時間を進めるとコールバックが実行される
      jest.advanceTimersByTime(3 * 60 * 1000);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // 昼のフェーズの時間を進めてもコールバックが実行されないことを確認
      jest.advanceTimersByTime(7 * 60 * 1000); // 残り7分
      expect(mockCallback).toHaveBeenCalledTimes(1); // 1回のまま
    });

    it('日数管理の統合テスト', () => {
      let currentDay = 0;

      // 昼のフェーズに切り替え（日数増加）
      phaseManager.switchPhase('day', mockCallback);
      currentDay++;
      expect(phaseManager.currentDay).toBe(currentDay);

      // 夜のフェーズに切り替え（日数増加なし）
      phaseManager.switchPhase('night', mockCallback);
      expect(phaseManager.currentDay).toBe(currentDay);

      // 次の昼のフェーズに切り替え（日数増加）
      phaseManager.switchPhase('day', mockCallback);
      currentDay++;
      expect(phaseManager.currentDay).toBe(currentDay);

      // 準備フェーズに切り替え（日数増加なし）
      phaseManager.switchPhase('pre', mockCallback);
      expect(phaseManager.currentDay).toBe(currentDay);
    });
  });
});
