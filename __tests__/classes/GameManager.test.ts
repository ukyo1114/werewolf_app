import { EventEmitter } from 'events';
import { CurrentPhase, Status, IGameState } from '../../src/config/types';
jest.mock('../../src/app', () => ({
  appState: {
    gameManagers: {},
  },
  Events: {
    gameEvents: new EventEmitter(),
    channelEvents: new EventEmitter(),
  },
}));

import mongoose from 'mongoose';
import Game from '../../src/models/Game';
import GameUser from '../../src/models/GameUser';
import GameManager from '../../src/classes/GameManager';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import VoteManager from '../../src/classes/VoteManager';
import DevineManager from '../../src/classes/DevineManager';
import MediumManager from '../../src/classes/MediumManager';
import GuardManager from '../../src/classes/GuardManager';
import AttackManager from '../../src/classes/AttackManager';
import {
  gamePlayers,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../__mocks__/mockdata';
import { gameMaster } from '../../src/config/messages';
import { appState, Events } from '../../src/app';
import { createMockUser } from '../../__mocks__/createMockUser';
import User from '../../src/models/User';

describe('test GameManager', () => {
  const { gameManagers } = appState;
  const { gameEvents, channelEvents } = Events;
  let registerListnersSpy: any;
  let gameEventsSpy: any;
  let channelEventsSpy: any;
  let game: GameManager;
  let emitSpy: any;

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  beforeEach(() => {
    registerListnersSpy = jest.spyOn(GameManager.prototype, 'registerListners');

    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );

    gameEventsSpy = jest.spyOn(gameEvents, 'emit');
    channelEventsSpy = jest.spyOn(channelEvents, 'emit');
    game = gameManagers[mockGameId];
    game.playerManager.players = gamePlayers();
    emitSpy = jest.spyOn(game.eventEmitter, 'emit').mockImplementation();
  });

  afterEach(() => {
    const timerId = game.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    // Object.keys(gameManagers).forEach((key) => delete gameManagers[key]);
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete gameManagers[mockGameId];
    jest.restoreAllMocks();
  });

  it('test constructor', () => {
    expect(game.channelId).toBe(mockChannelId);
    expect(game.gameId).toBe(mockGameId);
    expect(game.playerManager).toBeInstanceOf(PlayerManager);
    expect(game.voteManager).toBeInstanceOf(VoteManager);
    expect(game.devineManager).toBeInstanceOf(DevineManager);
    expect(game.mediumManager).toBeInstanceOf(MediumManager);
    expect(game.guardManager).toBeInstanceOf(GuardManager);
    expect(game.attackManager).toBeInstanceOf(AttackManager);
    expect(game.phaseManager).toBeInstanceOf(PhaseManager);
    expect(game.result).toEqual({ value: 'running' });
    expect(game.isProcessing).toBe(false);
    expect(game.eventEmitter).toBeInstanceOf(EventEmitter);
    expect(registerListnersSpy).toHaveBeenCalled();
  });

  it('test registerListners', () => {
    const mockOn = jest.spyOn(game.eventEmitter, 'on');

    game.registerListners();

    expect(mockOn).toHaveBeenCalledWith('timerEnd', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('phaseSwitched', expect.any(Function));

    mockOn.mockRestore();
  });

  describe('test handleTimerEnd', () => {
    let sendMessageMock: any;
    let handleDayPhaseEndMock: any;
    let handleNightPhaseEndMock: any;
    let handleGameEndMock: any;

    beforeEach(() => {
      sendMessageMock = jest.spyOn(game, 'sendMessage').mockImplementation();
      handleDayPhaseEndMock = jest
        .spyOn(game, 'handleDayPhaseEnd')
        .mockImplementation();
      handleNightPhaseEndMock = jest
        .spyOn(game, 'handleNightPhaseEnd')
        .mockImplementation();
      handleGameEndMock = jest
        .spyOn(game, 'handleGameEnd')
        .mockImplementation();
    });

    afterEach(() => {
      sendMessageMock.mockRestore();
      handleDayPhaseEndMock.mockRestore();
      handleNightPhaseEndMock.mockRestore();
      handleGameEndMock.mockRestore();
    });

    it('preフェーズのとき', async () => {
      game.phaseManager.currentPhase = 'pre';

      await game.handleTimerEnd();
      expect(game.isProcessing).toBe(true);
      expect(sendMessageMock).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('processCompleted');
      expect(handleDayPhaseEndMock).not.toHaveBeenCalled();
      expect(handleNightPhaseEndMock).not.toHaveBeenCalled();
      expect(handleGameEndMock).not.toHaveBeenCalled();
    });

    it('dayフェーズのとき', async () => {
      game.phaseManager.currentPhase = 'day';

      await game.handleTimerEnd();

      expect(game.isProcessing).toBe(true);
      expect(handleDayPhaseEndMock).toHaveBeenCalled;
      expect(emitSpy).toHaveBeenCalledWith('processCompleted');
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(handleNightPhaseEndMock).not.toHaveBeenCalled();
      expect(handleGameEndMock).not.toHaveBeenCalled();
    });

    it('nightフェーズのとき', async () => {
      game.phaseManager.currentPhase = 'night';

      await game.handleTimerEnd();
      expect(game.isProcessing).toBe(true);
      expect(handleNightPhaseEndMock).toHaveBeenCalled;
      expect(emitSpy).toHaveBeenCalledWith('processCompleted');
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(handleDayPhaseEndMock).not.toHaveBeenCalled();
      expect(handleGameEndMock).not.toHaveBeenCalled();
    });

    it('finighedフェーズのとき', async () => {
      game.phaseManager.currentPhase = 'finished';

      await game.handleTimerEnd();
      expect(game.isProcessing).toBe(true);
      expect(handleGameEndMock).toHaveBeenCalled;
      expect(emitSpy).not.toHaveBeenCalledWith('processCompleted');
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(handleDayPhaseEndMock).not.toHaveBeenCalled();
      expect(handleNightPhaseEndMock).not.toHaveBeenCalled();
    });
  });

  describe('test handleDayPhaseEnd', () => {
    let executionMock: any;
    let judgementMock: any;
    let sendMessageMock: any;

    beforeEach(() => {
      executionMock = jest.spyOn(game, 'execution').mockImplementation();
      judgementMock = jest.spyOn(game, 'judgement').mockImplementation();
      sendMessageMock = jest.spyOn(game, 'sendMessage').mockImplementation();
    });

    afterEach(() => {
      executionMock.mockRestore();
      judgementMock.mockRestore();
      sendMessageMock.mockRestore();
    });

    it('should call execution and judgement', async () => {
      await game.handleDayPhaseEnd();
      expect(executionMock).toHaveBeenCalled();
      expect(judgementMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalled();
    });

    it('should not call execution and judgement if result is villageAbandoned', async () => {
      executionMock.mockImplementation(() => {
        game.result.value = 'villageAbandoned';
      });

      await game.handleDayPhaseEnd();
      expect(executionMock).toHaveBeenCalled();
      expect(judgementMock).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('should call sendMessage if result is running', async () => {
      judgementMock.mockImplementation(() => {
        game.result.value = 'villagersWin';
      });

      await game.handleDayPhaseEnd();
      expect(executionMock).toHaveBeenCalled();
      expect(judgementMock).toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });
  });

  describe('test execution', () => {
    let getExecutionTargetMock: any;
    let villageAbandonedMock: any;
    let killMock: any;
    let sendMessageMock: any;
    let suicideMock: any;
    let mediumMock: any;

    beforeEach(() => {
      getExecutionTargetMock = jest.spyOn(
        game.voteManager,
        'getExecutionTarget',
      );
      villageAbandonedMock = jest
        .spyOn(game, 'villageAbandoned')
        .mockImplementation();
      killMock = jest.spyOn(game.playerManager, 'kill').mockImplementation();
      sendMessageMock = jest.spyOn(game, 'sendMessage').mockImplementation();
      suicideMock = jest.spyOn(game, 'suicide').mockImplementation();
      mediumMock = jest.spyOn(game.mediumManager, 'medium');
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call kill, sendMessage, suicide, medium', async () => {
      getExecutionTargetMock.mockReturnValue('villager');

      await game.execution();
      expect(killMock).toHaveBeenCalledWith('villager');
      expect(sendMessageMock).toHaveBeenCalled();
      expect(suicideMock).not.toHaveBeenCalled();
      expect(mediumMock).toHaveBeenCalled();
    });

    it('should not call kill, sendMessage, suicide, medium if executionTarget is null', async () => {
      getExecutionTargetMock.mockReturnValue(null);

      await game.execution();
      expect(killMock).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(suicideMock).not.toHaveBeenCalled();
      expect(mediumMock).not.toHaveBeenCalled();
    });

    it('should call suicide if executionTarget is fox', async () => {
      getExecutionTargetMock.mockReturnValue('fox');

      await game.execution();
      expect(suicideMock).toHaveBeenCalled();
      expect(killMock).toHaveBeenCalledWith('fox');
      expect(sendMessageMock).toHaveBeenCalled();
      expect(mediumMock).toHaveBeenCalled();
    });
  });

  describe('test handleNightPhaseEnd', () => {
    let devineMock: any;
    let attackMock: any;
    let curseMock: any;
    let sendMessageMock: any;
    let judgementMock: any;

    beforeEach(() => {
      devineMock = jest
        .spyOn(game.devineManager, 'devine')
        .mockReturnValue(false);
      attackMock = jest
        .spyOn(game.attackManager, 'attack')
        .mockResolvedValue('villager');
      curseMock = jest.spyOn(game, 'curse').mockResolvedValue('fox');
      sendMessageMock = jest.spyOn(game, 'sendMessage').mockImplementation();
      judgementMock = jest.spyOn(game, 'judgement').mockImplementation();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call devine, attack, curse, sendMessage, judgement', async () => {
      await game.handleNightPhaseEnd();
      expect(devineMock).toHaveBeenCalled();
      expect(attackMock).toHaveBeenCalled();
      expect(curseMock).not.toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(
        gameMaster.ATTACK(['villager']),
      );
      expect(judgementMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.MORNING);
    });

    it('should call devine, attack, sendMessage, judgement', async () => {
      attackMock.mockReturnValue(null);

      await game.handleNightPhaseEnd();
      expect(devineMock).toHaveBeenCalled();
      expect(attackMock).toHaveBeenCalled();
      expect(curseMock).not.toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.ATTACK([]));
      expect(judgementMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.MORNING);
    });

    it('should call curse, sendMessage, judgement', async () => {
      devineMock.mockReturnValue(true);

      await game.handleNightPhaseEnd();
      expect(devineMock).toHaveBeenCalled();
      expect(attackMock).toHaveBeenCalled();
      expect(curseMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(
        gameMaster.ATTACK(['villager', 'fox']),
      );
      expect(judgementMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.MORNING);
    });

    it('should call attack, curse, sendMessage, judgement', async () => {
      devineMock.mockReturnValue(true);
      attackMock.mockReturnValue(null);

      await game.handleNightPhaseEnd();
      expect(devineMock).toHaveBeenCalled();
      expect(attackMock).toHaveBeenCalled();
      expect(curseMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.ATTACK(['fox']));
      expect(judgementMock).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.MORNING);
    });

    it('should call judgement', async () => {
      judgementMock.mockImplementation(() => {
        game.result.value = 'villagersWin';
      });

      await game.handleNightPhaseEnd();
      expect(devineMock).toHaveBeenCalled();
      expect(attackMock).toHaveBeenCalled();
      expect(curseMock).not.toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledWith(
        gameMaster.ATTACK(['villager']),
      );
      expect(judgementMock).toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalledWith(gameMaster.MORNING);
    });
  });

  describe('test curse', () => {
    let getLivingPlayersMock: any;
    let killMock: any;
    let suicideMock: any;

    beforeEach(() => {
      killMock = jest.spyOn(game.playerManager, 'kill').mockImplementation();
      suicideMock = jest.spyOn(game, 'suicide').mockImplementation();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call kill, suicide, sendMessage', async () => {
      getLivingPlayersMock = jest
        .spyOn(game.playerManager, 'getLivingPlayers')
        .mockReturnValue([
          {
            userId: 'fox',
            userName: 'fox',
            role: 'fox',
            status: 'alive',
            teammates: [],
          },
        ]);

      const fox = await game.curse();
      expect(killMock).toHaveBeenCalled();
      expect(suicideMock).toHaveBeenCalled();
      expect(fox).toBe('fox');
    });

    it('should throw error if fox is not found', async () => {
      getLivingPlayersMock = jest
        .spyOn(game.playerManager, 'getLivingPlayers')
        .mockReturnValue([]);

      await expect(game.curse()).resolves.toBeUndefined();
      expect(killMock).not.toHaveBeenCalled();
      expect(suicideMock).not.toHaveBeenCalled();
    });
  });

  describe('test suicide', () => {
    let getLivingPlayersMock: any;
    let killMock: any;
    let sendMessageMock: any;

    beforeEach(() => {
      killMock = jest.spyOn(game.playerManager, 'kill').mockImplementation();
      sendMessageMock = jest.spyOn(game, 'sendMessage').mockImplementation();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call kill, sendMessage', async () => {
      getLivingPlayersMock = jest
        .spyOn(game.playerManager, 'getLivingPlayers')
        .mockReturnValue([
          {
            userId: 'immoralist',
            userName: 'immoralist',
            role: 'immoralist',
            status: 'alive',
            teammates: [],
          },
        ]);

      await game.suicide();
      expect(killMock).toHaveBeenCalledWith('immoralist');
      expect(sendMessageMock).toHaveBeenCalledWith(
        gameMaster.KILL_IMMORALIST(['immoralist']),
      );
    });

    it('should call kill, sendMessage', async () => {
      getLivingPlayersMock = jest
        .spyOn(game.playerManager, 'getLivingPlayers')
        .mockReturnValue([]);

      await game.suicide();
      expect(killMock).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });
  });

  describe('test handleGameEnd', () => {
    it('should call gameModel.findByIdAndUpdate', async () => {
      Game.findByIdAndUpdate = jest.fn();
      await game.handleGameEnd();
      expect(Game.findByIdAndUpdate).toHaveBeenCalled();
      expect(gameManagers[mockGameId]).toBeUndefined();
    });

    it('should throw error if gameModel.findByIdAndUpdate fails', async () => {
      Game.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error());
      await game.handleGameEnd();
      expect(Game.findByIdAndUpdate).toHaveBeenCalled();
      expect(gameManagers[mockGameId]).toBeUndefined();
    });
  });

  describe('test villageAbandoned', () => {
    let sendMessageMock: any;

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call sendMessage', async () => {
      sendMessageMock = jest.spyOn(game, 'sendMessage').mockImplementation();
      await game.villageAbandoned();
      expect(game.result.value).toBe('villageAbandoned');
      expect(sendMessageMock).toHaveBeenCalledWith(
        gameMaster.VILLAGE_ABANDONED,
      );
    });
  });

  describe('test judgement', () => {
    let getLivingPlayersMock: any;
    let sendMessageMock: any;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      getLivingPlayersMock = jest.spyOn(game.playerManager, 'getLivingPlayers');
      sendMessageMock = jest.spyOn(game, 'sendMessage').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.clearAllMocks();
      consoleErrorSpy.mockRestore();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should continue game when multiple players from different teams are alive', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'villager', status: 'alive' },
        { role: 'villager', status: 'alive' },
        { role: 'werewolf', status: 'alive' },
        { role: 'fox', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(game.result.value).toBe('running');
    });

    it('should declare villagers win when only villagers remain', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'villager', status: 'alive' },
        { role: 'villager', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.VILLAGERS_WIN);
      expect(game.result.value).toBe('villagersWin');
    });

    it('should declare werewolves win when only werewolves remain', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'werewolf', status: 'alive' },
        { role: 'werewolf', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.WEREWOLVES_WIN);
      expect(game.result.value).toBe('werewolvesWin');
    });

    it('should declare foxes win when only fox remains', async () => {
      getLivingPlayersMock.mockReturnValue([{ role: 'fox', status: 'alive' }]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.FOXES_WIN);
      expect(game.result.value).toBe('foxesWin');
    });

    it('should handle tie between villagers and werewolves', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'villager', status: 'alive' },
        { role: 'werewolf', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.WEREWOLVES_WIN);
      expect(game.result.value).toBe('werewolvesWin');
    });

    it('should handle tie between villagers and fox', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'villager', status: 'alive' },
        { role: 'fox', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.FOXES_WIN);
      expect(game.result.value).toBe('foxesWin');
    });

    it('should handle tie between werewolves and fox', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'werewolf', status: 'alive' },
        { role: 'fox', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.FOXES_WIN);
      expect(game.result.value).toBe('foxesWin');
    });

    it('should handle all players being dead', async () => {
      getLivingPlayersMock.mockReturnValue([]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.VILLAGERS_WIN);
      expect(game.result.value).toBe('villagersWin');
    });

    it('should handle mixed status players correctly', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'villager', status: 'alive' },
        { role: 'werewolf', status: 'dead' },
        { role: 'fox', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(game.result.value).toBe('running');
    });

    it('should handle special roles correctly', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'immoralist', status: 'alive' },
        { role: 'villager', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).toHaveBeenCalledWith(gameMaster.VILLAGERS_WIN);
      expect(game.result.value).toBe('villagersWin');
    });

    it('should handle multiple special roles correctly', async () => {
      getLivingPlayersMock.mockReturnValue([
        { role: 'immoralist', status: 'alive' },
        { role: 'fox', status: 'alive' },
        { role: 'werewolf', status: 'alive' },
      ]);

      await game.judgement();
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(game.result.value).toBe('running');
    });
  });

  describe('test sendMessage', () => {
    it('should call Message.create', async () => {
      await game.sendMessage('testMessage');
      expect(channelEventsSpy).toHaveBeenCalled();
    });
  });

  describe('test handlePhaseSwitched', () => {
    let updateGameStateMock: any;

    beforeEach(() => {
      game.isProcessing = true;
      updateGameStateMock = jest
        .spyOn(game, 'updateGameState')
        .mockImplementation();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call updateGameState', async () => {
      game.handlePhaseSwitched();
      expect(updateGameStateMock).toHaveBeenCalled();
      expect(game.isProcessing).toBe(false);
    });
  });

  describe('test updateGameState', () => {
    let getGameStateMock: any;

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should emit updateGameState event with current game state', async () => {
      const gameState: IGameState = {
        gameId: mockGameId,
        phase: {
          currentDay: 1,
          currentPhase: 'day' as CurrentPhase,
          changedAt: new Date(),
        },
        users: {
          villager: {
            status: 'alive' as Status,
            role: 'villager',
            teammates: [],
          },
        },
      };
      getGameStateMock = jest
        .spyOn(game, 'getGameState')
        .mockReturnValue(gameState);

      game.updateGameState();
      expect(gameEventsSpy).toHaveBeenCalledWith('updateGameState', gameState);
    });
  });

  describe('test getGameState', () => {
    let getPlayersInfoMock: any;

    beforeEach(() => {
      getPlayersInfoMock = jest.spyOn(game.playerManager, 'getPlayersInfo');
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should return game state with hidden roles during active game', () => {
      const gameState = game.getGameState();
      expect(gameState.gameId).toBe(mockGameId);
      expect(getPlayersInfoMock).toHaveBeenCalledWith(false);
    });

    it('should return game state with revealed roles when game is finished', () => {
      game.phaseManager.currentPhase = 'finished';
      const gameState = game.getGameState();
      expect(gameState.gameId).toBe(mockGameId);
      expect(getPlayersInfoMock).toHaveBeenCalledWith(true);
    });
  });

  describe('test createGameManager', () => {
    let mockUsers: any;

    beforeEach(async () => {
      await User.deleteMany();
      await GameUser.deleteMany();
      await Game.deleteMany();
      mockUsers = await createMockUser();
    });

    it('should create game manager', async () => {
      const users = Object.values(mockUsers) as string[];
      const gameId = await GameManager.createGameManager(mockChannelId, users);

      const game = await Game.findById(gameId);
      expect(game).not.toBeNull();
      expect(gameManagers[gameId]).toBeInstanceOf(GameManager);
      const gameUser = await GameUser.find({ gameId });
      expect(gameUser.length).toBe(users.length);
      gameUser.forEach((user) => {
        expect(user.isPlaying).toBe(true);
      });

      const timerId = gameManagers[gameId].phaseManager.timerId;
      if (timerId) clearTimeout(timerId);
      delete gameManagers[gameId];
    });

    it('should throw error and clean up when users are not found', async () => {
      const users = Object.values(mockUsers) as string[];
      const invalidUserId = new mongoose.Types.ObjectId().toString();
      const usersWithInvalid = [...users, invalidUserId];

      await expect(
        GameManager.createGameManager(mockChannelId, usersWithInvalid),
      ).rejects.toThrow();

      const games = await Game.find({ channelId: mockChannelId });
      expect(games).toHaveLength(0);

      const gameUsers = await GameUser.find({});
      expect(gameUsers).toHaveLength(0);
    });

    it('should throw error and clean up when GameUser creation fails', async () => {
      const users = Object.values(mockUsers) as string[];

      // GameUser.createをモックして失敗させる
      const originalInsertMany = GameUser.insertMany;
      GameUser.insertMany = jest
        .fn()
        .mockRejectedValue(new Error('Failed to create game users'));

      await expect(
        GameManager.createGameManager(mockChannelId, users),
      ).rejects.toThrow('Failed to create game users');

      // ゲームが作成されていないことを確認
      const games = await Game.find({ channelId: mockChannelId });
      expect(games).toHaveLength(0);

      // GameUserが作成されていないことを確認
      const gameUsers = await GameUser.find({});
      expect(gameUsers).toHaveLength(0);

      // モックを元に戻す
      GameUser.insertMany = originalInsertMany;
    });
  });

  describe('test checkIsUserInGame', () => {
    it('should return true when user is in game', () => {
      const isInGame = GameManager.checkIsUserInGame('villager');
      expect(isInGame).toBe(true);
    });

    it('should return false when user is not in game', () => {
      const isInGame = GameManager.checkIsUserInGame('notInGame');
      expect(isInGame).toBe(false);
    });

    it('should return false when game is finished', () => {
      game.result.value = 'villagersWin';
      const isInGame = GameManager.checkIsUserInGame('villager');
      expect(isInGame).toBe(false);
    });
  });

  describe('test getGamesByChannelId', () => {
    it('should return games when channelId is valid', () => {
      const games = GameManager.getGamesByChannelId(mockChannelId);
      expect(games).toEqual([game]);
    });

    it('should return empty array when channelId is not valid', () => {
      const games = GameManager.getGamesByChannelId('notValidChannelId');
      expect(games).toEqual([]);
    });
  });
});
