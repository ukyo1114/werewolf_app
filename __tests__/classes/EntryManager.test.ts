import { EventEmitter } from 'events';
jest.mock('../../src/app', () => ({
  appState: {
    gameManagers: {},
  },
  Events: {
    entryEvents: new EventEmitter(),
    channelEvents: new EventEmitter(),
  },
}));

import { Events } from '../../src/app';
import GameManager from '../../src/classes/GameManager';
import EntryManager from '../../src/classes/EntryManager';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
} from '../../__mocks__/mockdata';

describe('EntryManager', () => {
  const { entryEvents } = Events;
  let entryManager: EntryManager;
  let entryUpdateSpy: jest.SpyInstance;
  let entryEmitSpy: jest.SpyInstance;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 1);
    entryEmitSpy = jest.spyOn(entryEvents, 'emit');

    entryUpdateSpy = jest
      .spyOn(EntryManager.prototype, 'entryUpdate')
      .mockImplementation();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with correct initial values', () => {
      expect(entryManager.channelId).toBe(mockChannelId);
      expect(entryManager.MAX_USERS).toBe(1);
      expect(entryManager.isProcessing).toBe(false);
      expect(entryManager.users).toEqual({});
    });
  });

  describe('register', () => {
    const startGameSpy = jest
      .spyOn(EntryManager.prototype, 'startGame')
      .mockImplementation();

    beforeEach(() => {
      startGameSpy.mockClear();
    });

    afterAll(() => {
      startGameSpy.mockRestore();
    });

    it('should add a user to the users list', async () => {
      await entryManager.register(mockUserId, 'testSocketId');

      expect(entryManager.users).toEqual({
        testSocketId: { userId: mockUserId },
      });
      expect(entryUpdateSpy).toHaveBeenCalled();
    });

    it('should throw an error if the game is being processed', async () => {
      entryManager.isProcessing = true;

      await expect(() =>
        entryManager.register(mockUserId, 'testSocketId'),
      ).rejects.toThrow();
    });

    it('should call startGame when the user count reaches the maximum', async () => {
      await entryManager.register(mockUserId, 'testSocketId');

      expect(entryManager.isProcessing).toBe(true);
      expect(startGameSpy).toHaveBeenCalled();
      expect(entryUpdateSpy).toHaveBeenCalled();
    });

    it('should not call startGame when the user count does not reach the maximum', async () => {
      entryManager.MAX_USERS = 2;
      await entryManager.register(mockUserId, 'testSocketId');

      expect(entryManager.isProcessing).toBe(false);
      expect(entryManager.users).toEqual({
        testSocketId: { userId: mockUserId },
      });
      expect(startGameSpy).not.toHaveBeenCalled();
      expect(entryUpdateSpy).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      entryManager.users = { testSocketId: { userId: mockUserId } };
    });

    it('should remove a user from the users list', () => {
      entryManager.cancel('testSocketId');

      expect(entryManager.users).toEqual({});
      expect(entryUpdateSpy).toHaveBeenCalled();
    });

    it('should throw an error if the game is being processed', () => {
      entryManager.isProcessing = true;
      expect(() => entryManager.cancel('testSocketId')).toThrow();
      expect(entryUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('entryUpdate', () => {
    it('should emit the entryUpdate event with correct data', () => {
      entryManager.users = { testSocketId: { userId: mockUserId } };
      entryUpdateSpy.mockRestore();
      entryManager.entryUpdate();

      expect(entryEmitSpy).toHaveBeenCalledWith('entryUpdate', {
        channelId: mockChannelId,
        userList: [mockUserId],
      });
    });
  });

  describe('getUserList', () => {
    it('should return the list of user IDs', () => {
      entryManager.users = { testSocketId: { userId: mockUserId } };

      const userList = entryManager.getUserList();
      expect(userList).toEqual([mockUserId]);
    });

    it('should return an empty array when no users are present', () => {
      const userList = entryManager.getUserList();
      expect(userList).toEqual([]);
    });
  });

  describe('startGame', () => {
    let emitGameStartSpy: jest.SpyInstance;
    let getUserListSpy: jest.SpyInstance;

    beforeEach(() => {
      entryManager.users = { testSocketId: { userId: mockUserId } };
      entryManager.isProcessing = true;
      emitGameStartSpy = jest
        .spyOn(entryManager, 'emitGameStart')
        .mockImplementation();
      getUserListSpy = jest
        .spyOn(entryManager, 'getUserList')
        .mockReturnValue([mockUserId]);
    });

    afterAll(() => {
      emitGameStartSpy.mockRestore();
      getUserListSpy.mockRestore();
    });

    it('should create a game and emit game start event', async () => {
      GameManager.createGameManager = jest.fn().mockResolvedValue(mockGameId);
      await entryManager.startGame();

      expect(GameManager.createGameManager).toHaveBeenCalledWith(
        mockChannelId,
        [mockUserId],
      );
      expect(emitGameStartSpy).toHaveBeenCalledWith(mockGameId);
      expect(entryManager.users).toEqual({});
      expect(entryManager.isProcessing).toBe(false);
    });

    it('should emit game creation failed event if game creation fails', async () => {
      GameManager.createGameManager = jest.fn().mockRejectedValue(new Error());
      const error: any = new Error();
      error.status = 500;
      await expect(entryManager.startGame()).rejects.toThrow(error);

      expect(emitGameStartSpy).not.toHaveBeenCalled();
      expect(entryManager.users).toEqual({});
      expect(entryManager.isProcessing).toBe(false);
    });
  });

  describe('emitGameStart', () => {
    it('should emit game start event with correct data', () => {
      const entryManager = new EntryManager(mockChannelId, 1);
      entryManager.users = { testSocketId: { userId: mockUserId } };
      entryManager.emitGameStart(mockGameId);

      expect(entryEmitSpy).toHaveBeenCalledWith('gameStart', {
        users: ['testSocketId'],
        gameId: mockGameId,
      });
    });
  });
});
