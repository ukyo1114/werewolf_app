import { gameManagers, gameEvents, channelEvents } from '../../jest.setup';
import { EventEmitter } from 'events';
import GameManager from '../../src/classes/GameManager';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import VoteManager from '../../src/classes/VoteManager';
import DevineManager from '../../src/classes/DevineManager';
import MediumManager from '../../src/classes/MediumManager';
import GuardManager from '../../src/classes/GuardManager';
import AttackManager from '../../src/classes/AttackManager';
import { ObjectId } from 'mongodb';
import {
  gamePlayers,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../__mocks__/mockdata';
import { IGameState } from '../../src/config/types';
import { gameMaster } from '../../src/config/messages';

const gameEventsSpy = jest.spyOn(gameEvents, 'emit');
const channelEventsSpy = jest.spyOn(channelEvents, 'emit');

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

  /*   describe("test execution", () => {
    beforeAll(() => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = structuredClone(gamePlayers);
    });

    it("")
  }) */

  it('test villageAbandoned', async () => {
    const game = gameManagers[mockGameId];
    const sendMessageSpy = jest.spyOn(game, 'sendMessage');

    await game.villageAbandoned();
    expect(game.result.value).toBe('villageAbandoned');
    expect(sendMessageSpy).toHaveBeenCalled();

    sendMessageSpy.mockRestore();
  });

  describe('test judgement', () => {
    let sendMessageMock: any;

    beforeAll(() => {
      const game = gameManagers[mockGameId];
      sendMessageMock = jest.spyOn(game, 'sendMessage');
    });

    afterAll(() => {
      sendMessageMock.mockRestore();
    });

    it('村人勝利', async () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = structuredClone(gamePlayers);

      const killRoles = ['fox', 'werewolf'];
      killRoles.forEach((role) => {
        game.playerManager.players[role].status = 'dead';
      });

      await game.judgement();
      expect(game.result.value).toBe('villagersWin');
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.VILLAGERS_WIN);
    });

    it('人狼勝利', async () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = structuredClone(gamePlayers);

      const killRoles = [
        'seer',
        'medium',
        'hunter',
        'freemason',
        'fanatic',
        'fox',
        'immoralist',
      ];
      killRoles.forEach((role) => {
        game.playerManager.players[role].status = 'dead';
      });

      await game.judgement();
      expect(game.result.value).toBe('werewolvesWin');
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.WEREWOLVES_WIN);
    });

    it('妖狐勝利', async () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = structuredClone(gamePlayers);
      game.playerManager.players.werewolf.status = 'dead';

      await game.judgement();
      expect(game.result.value).toBe('foxesWin');
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.FOXES_WIN);
    });
  });

  it('test sendMessage', async () => {
    const game = gameManagers[mockGameId];
    const createMessageSpy = jest.spyOn(game, 'createMessage');
    const testMessage = 'testMessage';

    await game.sendMessage(testMessage);
    expect(createMessageSpy).toHaveBeenCalledWith(testMessage);
    expect(channelEventsSpy).toHaveBeenCalledWith(
      'newMessage',
      expect.anything(),
    );

    createMessageSpy.mockRestore();
  });

  it('test createMessage', async () => {
    const game = gameManagers[mockGameId];

    const createdMessage = await game.createMessage('test');
    const RequiredProperties = [
      '_id',
      'channelId',
      'userId',
      'message',
      'messageType',
      'createdAt',
    ];
    RequiredProperties.forEach((property) => {
      expect(createdMessage).toHaveProperty(property);
    });
  });

  it('test handleSwitched', () => {
    const game = gameManagers[mockGameId];
    game.isProcessing = true;
    const updateGameStateMock = jest
      .spyOn(game, 'updateGameState')
      .mockImplementation();

    game.handlePhaseSwitched();
    expect(game.isProcessing).toBe(false);
    expect(updateGameStateMock).toHaveBeenCalled();

    updateGameStateMock.mockRestore();
  });

  it('test updateGameState', () => {
    const mockGameState: IGameState = {
      gameId: 'testGameId',
      phase: {
        currentDay: 1,
        currentPhase: 'day',
        changedAt: new Date(),
      },
      users: {},
    };
    const game = gameManagers[mockGameId];
    const getGameStateMock = jest
      .spyOn(game, 'getGameState')
      .mockReturnValue(mockGameState);

    game.updateGameState();
    expect(getGameStateMock).toHaveBeenCalled();
    expect(gameEventsSpy).toHaveBeenCalledWith(
      'updateGameState',
      mockGameState,
    );

    getGameStateMock.mockRestore();
  });

  describe('test getGameState', () => {
    it('currentPhaseがfinishedのとき', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'finished';
      const getPlayersWithRoleSpy = jest.spyOn(
        game.playerManager,
        'getPlayersWithRole',
      );

      const gameState = game.getGameState();
      expect(getPlayersWithRoleSpy).toHaveBeenCalled();
      expect(gameState).toHaveProperty('gameId');
      expect(gameState).toHaveProperty('phase');
      expect(gameState).toHaveProperty('users');

      getPlayersWithRoleSpy.mockRestore();
    });

    it('currentPhaseがfinished以外のとき', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';
      const getPlayersWithoutRoleSpy = jest.spyOn(
        game.playerManager,
        'getPlayersWithoutRole',
      );

      const gameState = game.getGameState();
      expect(getPlayersWithoutRoleSpy).toHaveBeenCalled();
      expect(gameState).toHaveProperty('gameId');
      expect(gameState).toHaveProperty('phase');
      expect(gameState).toHaveProperty('users');

      getPlayersWithoutRoleSpy.mockRestore();
    });
  });
});
