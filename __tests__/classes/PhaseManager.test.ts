import { EventEmitter } from 'events';
import PhaseManager, { IResult } from '../../src/classes/PhaseManager';

const startTimerSpy = jest.spyOn(PhaseManager.prototype, 'startTimer');
const nextPhaseSpy = jest.spyOn(PhaseManager.prototype, 'nextPhase');
const consoleErrorSpy = jest.spyOn(console, 'error');

describe('test PhaseManager', () => {
  const result: IResult = { value: 'running' };
  let phaseManager: PhaseManager;

  beforeEach(() => {
    jest.useFakeTimers();
    phaseManager = new PhaseManager(new EventEmitter(), result);
  });

  afterAll(() => {
    const timerId = phaseManager.timerId;
    if (timerId) clearTimeout(timerId);

    jest.restoreAllMocks();
  });

  it('正しく初期化されること', () => {
    expect(phaseManager).toBeInstanceOf(PhaseManager);
    expect(phaseManager.currentDay).toBe(0);
    expect(phaseManager.currentPhase).toBe('pre');
    expect(phaseManager.result).toEqual({ value: 'running' });
    expect(phaseManager.eventEmitter).toBeInstanceOf(EventEmitter);
    expect(startTimerSpy).toHaveBeenCalled();
  });

  it('test registerListner', () => {
    const mockOn = jest.spyOn(phaseManager.eventEmitter, 'on');
    phaseManager.registerListner();

    expect(mockOn).toHaveBeenCalledWith(
      'processCompleted',
      expect.any(Function),
    );
    mockOn.mockRestore();
  });

  it('test startTimer', () => {
    const mockEmit = jest.spyOn(phaseManager.eventEmitter, 'emit');
    const msToRun =
      phaseManager.phaseDurations_sec[phaseManager.currentPhase] * 1000;

    jest.advanceTimersByTime(msToRun);

    expect(mockEmit).toHaveBeenCalledWith('timerEnd');
    mockEmit.mockRestore();
  });

  it('test nextPhase', () => {
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
    phaseManager.result.value = 'villagersWin';
    phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(2);
    expect(phaseManager.currentPhase).toBe('finished');

    expect(() => phaseManager.nextPhase()).toThrow();
  });

  it('processCompletedイベントを受信して処理を行うこと', () => {
    const mockEmit = jest.spyOn(phaseManager.eventEmitter, 'emit');

    phaseManager.eventEmitter.emit('processCompleted');

    expect(nextPhaseSpy).toHaveBeenCalled();
    expect(startTimerSpy).toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('phaseSwitched');

    mockEmit.mockRestore();
  });
});
