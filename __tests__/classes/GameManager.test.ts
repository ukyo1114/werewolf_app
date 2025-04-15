import { gameManagers } from '../../jest.setup';
import { EventEmitter } from 'events';
import GameManager from '../../src/classes/GameManager';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import VoteManager from '../../src/classes/VoteManager';
import DevineManager from '../../src/classes/DevineManager';
import MediumManager from '../../src/classes/MediumManager';
import GuardManager from '../../src/classes/GuardManager';
import AttackManager from '../../src/classes/AttackManager';
import { mockChannelId, mockGameId, mockUsers } from '../../__mocks__/mockdata';

describe('test GameManager', () => {
  beforeAll(() => {
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
  });

  afterAll(() => {
    const timerId = gameManagers[mockGameId]?.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);

    delete gameManagers[mockGameId];
    jest.restoreAllMocks();
  });

  it('test constructor', () => {
    const game = new GameManager(mockChannelId, mockGameId, mockUsers);
    const registerListnersSpy = jest.spyOn(game, 'registerListners');

    expect(game.channelId).toBe(mockChannelId);
    expect(game.gameId).toBe(mockGameId);
    expect(game.playerManager).toBeInstanceOf(PlayerManager);
    expect(game.voteManager).toBeInstanceOf(VoteManager);
    expect(game.devineManager).toBeInstanceOf(DevineManager);
    expect(game.mediumManager).toBeInstanceOf(MediumManager);
    expect(game.guardManager).toBeInstanceOf(GuardManager);
    expect(game.attackManager).toBeInstanceOf(AttackManager);
    expect(game.phaseManager).toBeInstanceOf(PhaseManager);
    expect(game.result.value).toBe('running');
    expect(game.isProcessing).toBe(false);
    expect(game.eventEmitter).toBeInstanceOf(EventEmitter);
    expect(registerListnersSpy).toHaveBeenCalled;

    const timerId = game.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    registerListnersSpy.mockRestore();
  });

  it('test registerListners', () => {
    const game = gameManagers[mockGameId];
    const mockOn = jest.spyOn(game.eventEmitter, 'on');

    game.registerListners();

    expect(mockOn).toHaveBeenCalledWith('timerEnd', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('phaseSwitched', expect.any(Function));

    mockOn.mockRestore();
  });

  describe('test handleTimerEnd', () => {
    let eventEmitterMock: any;

    beforeEach(() => {
      const game = gameManagers[mockGameId];
      eventEmitterMock = jest
        .spyOn(game.eventEmitter, 'emit')
        .mockImplementation();
    });

    afterEach(() => {
      eventEmitterMock.mockRestore();
    });

    it('preフェーズのとき', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'pre';
      game.isProcessing = false;
      const sendMessageMock = jest
        .spyOn(game, 'sendMessage')
        .mockImplementation();

      await game.handleTimerEnd();

      expect(game.isProcessing).toBe(true);
      expect(sendMessageMock).toHaveBeenCalled;
      expect(eventEmitterMock).toHaveBeenCalledWith('processCompleted');

      sendMessageMock.mockRestore();
    });

    it('dayフェーズのとき', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.isProcessing = false;
      const handleDayPhaseEndMock = jest
        .spyOn(game, 'handleDayPhaseEnd')
        .mockImplementation();

      await game.handleTimerEnd();

      expect(game.isProcessing).toBe(true);
      expect(handleDayPhaseEndMock).toHaveBeenCalled;
      expect(eventEmitterMock).toHaveBeenCalledWith('processCompleted');

      handleDayPhaseEndMock.mockRestore();
    });

    it('nightフェーズのとき', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.isProcessing = false;
      const handleNightPhaseEndMock = jest
        .spyOn(game, 'handleNightPhaseEnd')
        .mockImplementation();

      await game.handleTimerEnd();

      expect(game.isProcessing).toBe(true);
      expect(handleNightPhaseEndMock).toHaveBeenCalled;
      expect(eventEmitterMock).toHaveBeenCalledWith('processCompleted');

      handleNightPhaseEndMock.mockRestore();
    });

    it('finighedフェーズのとき', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'finished';
      game.isProcessing = false;
      const handleGameEndMock = jest
        .spyOn(game, 'handleGameEnd')
        .mockImplementation();

      await game.handleTimerEnd();

      expect(game.isProcessing).toBe(true);
      expect(handleGameEndMock).toHaveBeenCalled;
      expect(eventEmitterMock).not.toHaveBeenCalledWith('processCompleted');

      handleGameEndMock.mockRestore();
    });
  });
});
