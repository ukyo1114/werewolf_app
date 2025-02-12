import { EventEmitter } from 'events';
import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import PhaseManager from '../../src/classes/PhaseManager';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';

const startTimerSpy = jest.spyOn(PhaseManager.prototype, 'startTimer');
const nextPhaseSpy = jest.spyOn(PhaseManager.prototype, 'nextPhase');
const consoleErrorSpy = jest.spyOn(console, 'error');

describe('test PhaseManager', () => {
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

  it('正しいプロパティで初期化されること', () => {
    const phaseManager = games[mockGameId].phaseManager;

    expect(phaseManager).toBeInstanceOf(PhaseManager);
    expect(phaseManager.currentDay).toBe(0);
    expect(phaseManager.currentPhase).toBe('pre');
    expect(phaseManager.result).toHaveProperty('value');
    expect(phaseManager.eventEmitter).toBeInstanceOf(EventEmitter);
    expect(startTimerSpy).toHaveBeenCalled();
  });

  it('イベントリスナーが正しく登録されること', () => {
    const phaseManager = games[mockGameId].phaseManager;
    const mockOn = jest.spyOn(phaseManager.eventEmitter, 'on');

    phaseManager.registerListner();

    expect(mockOn).toHaveBeenCalledWith(
      'processCompleted',
      expect.any(Function),
    );

    mockOn.mockRestore();
  });

  it('タイマー終了時にタイマー終了イベントが発火されること', () => {
    const phaseManager = games[mockGameId].phaseManager;
    const mockEmit = jest.spyOn(phaseManager.eventEmitter, 'emit');
    const msToRun =
      phaseManager.phaseDurations_sec[phaseManager.currentPhase] * 1000;

    jest.advanceTimersByTime(msToRun);

    expect(mockEmit).toHaveBeenCalledWith('timerEnd');

    mockEmit.mockRestore();
  });

  it('フェーズが正しく切り替わること', () => {
    const phaseManager = games[mockGameId].phaseManager;

    // 準備中から昼へ
    phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(1);
    expect(phaseManager.currentPhase).toBe('day');

    // 昼から夜へ
    phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(1);
    expect(phaseManager.currentPhase).toBe('night');

    // 夜から翌日へ
    phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(2);
    expect(phaseManager.currentPhase).toBe('day');

    // ゲームが終了
    games[mockGameId].result.value = 'villagersWin';
    phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(2);
    expect(phaseManager.currentPhase).toBe('finished');

    phaseManager.nextPhase();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('processCompletedイベントを受信して処理を行うこと', () => {
    const phaseManager = games[mockGameId].phaseManager;
    const mockEmit = jest.spyOn(phaseManager.eventEmitter, 'emit');
    const msToRun =
      phaseManager.phaseDurations_sec[phaseManager.currentPhase] * 1000;

    jest.advanceTimersByTime(msToRun);

    games[mockGameId].eventEmitter.emit('processCompleted');

    expect(nextPhaseSpy).toHaveBeenCalled();
    expect(startTimerSpy).toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('timerEnd');

    mockEmit.mockRestore();
  });
});
