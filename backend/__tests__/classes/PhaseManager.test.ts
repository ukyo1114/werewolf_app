import { EventEmitter } from 'events';
import PhaseManager from '../../src/classes/PhaseManager';
import { ObjectId } from 'mongodb';
import GameUser from '../../src/models/GameUser';

describe('test PhaseManager', () => {
  GameUser.endGame = jest.fn();
  const testGameId = new ObjectId().toString();
  const registerListnerSpy = jest.spyOn(
    PhaseManager.prototype,
    'registerListner',
  );
  const startTimerSpy = jest.spyOn(PhaseManager.prototype, 'startTimer');
  const nextPhaseSpy = jest.spyOn(PhaseManager.prototype, 'nextPhase');
  let phaseManager: PhaseManager;

  beforeEach(() => {
    jest.useFakeTimers();
    phaseManager = new PhaseManager(
      new EventEmitter(),
      { value: 'running' },
      testGameId,
    );
    startTimerSpy.mockClear();
    nextPhaseSpy.mockClear();
  });

  afterAll(() => {
    const timerId = phaseManager.timerId;
    if (timerId) clearTimeout(timerId);

    jest.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    phaseManager = new PhaseManager(
      new EventEmitter(),
      { value: 'running' },
      testGameId,
    );

    expect(phaseManager).toBeInstanceOf(PhaseManager);
    expect(phaseManager.currentDay).toBe(0);
    expect(phaseManager.currentPhase).toBe('pre');
    expect(phaseManager.result).toEqual({ value: 'running' });
    expect(phaseManager.eventEmitter).toBeInstanceOf(EventEmitter);
    expect(registerListnerSpy).toHaveBeenCalled();
    expect(startTimerSpy).toHaveBeenCalled();
  });

  it('should register event listener for process completion', async () => {
    const mockOn = jest.spyOn(phaseManager.eventEmitter, 'on');
    const mockEmit = jest.spyOn(phaseManager.eventEmitter, 'emit');
    phaseManager.registerListner();

    expect(mockOn).toHaveBeenCalledWith(
      'processCompleted',
      expect.any(Function),
    );

    await new Promise<void>((resolve) => {
      nextPhaseSpy.mockImplementationOnce(() => {
        resolve();
        return Promise.resolve();
      });
      phaseManager.eventEmitter.emit('processCompleted');
    });

    expect(nextPhaseSpy).toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith('phaseSwitched');
    expect(startTimerSpy).toHaveBeenCalled();

    mockOn.mockRestore();
    mockEmit.mockRestore();
  });

  it('should start timer and emit timerEnd event when time is up', () => {
    const mockEmit = jest.spyOn(phaseManager.eventEmitter, 'emit');
    const msToRun =
      phaseManager.phaseDurations_sec[phaseManager.currentPhase] * 1000;

    jest.advanceTimersByTime(msToRun);

    expect(mockEmit).toHaveBeenCalledWith('timerEnd');
    mockEmit.mockRestore();
  });

  it('should transition through phases correctly', async () => {
    // From preparation to day
    await phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(1);
    expect(phaseManager.currentPhase).toBe('day');

    // From day to night
    await phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(1);
    expect(phaseManager.currentPhase).toBe('night');

    // From night to next day
    await phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(2);
    expect(phaseManager.currentPhase).toBe('day');

    // Game ends
    phaseManager.result.value = 'villagersWin';
    await phaseManager.nextPhase();
    expect(phaseManager.currentDay).toBe(2);
    expect(phaseManager.currentPhase).toBe('finished');

    await expect(phaseManager.nextPhase()).resolves.toBeUndefined();
  });
});
