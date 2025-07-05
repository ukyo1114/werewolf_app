import { EventEmitter } from 'events';

jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
    gameManagers: {},
  },
  Events: {
    channelEvents: new EventEmitter(),
    gameEvents: new EventEmitter(),
  },
}));

import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';
import { appState } from '../../src/app';
import Channel from '../../src/models/Channel';
import Game from '../../src/models/Game';
import GameManager from '../../src/classes/GameManager';
import ChannelManager from '../../src/classes/ChannelManager';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
  gamePlayers,
  channelUsers,
} from '../../__mocks__/mockdata';

describe('test ChannelManager', () => {
  const { channelManagers, gameManagers } = appState;
  const mockSocketId = 'mockSocketId';
  let game: GameManager;

  beforeAll(async () => {
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
    game = gameManagers[mockGameId];
    game.sendMessage = jest.fn();
    game.playerManager.players = gamePlayers();
  });

  afterAll(() => {
    const timerId = game.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);

    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize correctly for normal channel', () => {
      const channel = new ChannelManager(mockChannelId);

      expect(channel.channelId).toBe(mockChannelId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeNull;
    });

    it('should initialize correctly for game channel', () => {
      const channel = new ChannelManager(mockGameId, game);

      expect(channel.channelId).toBe(mockGameId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeInstanceOf(GameManager);
    });
  });

  describe('test userJoined', () => {
    it('should allow user to join normal channel', () => {
      const channel = new ChannelManager(mockChannelId);
      channel.userJoined(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];
      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });

    it('should allow user to join game channel', () => {
      const channel = new ChannelManager(mockGameId, game);

      channel.userJoined('villager', mockSocketId);
      const user = channel.users.villager;

      expect(user.userId).toBe('villager');
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });

    it('should set status to werewolf when user is werewolf', () => {
      const channel = new ChannelManager(mockGameId, game);

      channel.userJoined('werewolf', mockSocketId);
      const user = channel.users.werewolf;

      expect(user.userId).toBe('werewolf');
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('werewolf');
    });

    it('should set status to spectator when user is dead', () => {
      const channel = new ChannelManager(mockGameId, game);
      game.playerManager.players.villager.status = 'dead';

      channel.userJoined('villager', mockSocketId);
      const user = channel.users.villager;

      expect(user.userId).toBe('villager');
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('spectator');
    });

    it('should set status to spectator when user is not in game', () => {
      const channel = new ChannelManager(mockGameId, game);

      channel.userJoined(mockUserId, mockSocketId);
      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('spectator');
    });
  });

  describe('test userLeft', () => {
    it('should remove user when they leave', () => {
      channelManagers[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channelManagers[mockChannelId];
      channel.users = channelUsers();

      channel.userLeft('normal');

      expect(channel.users).not.toHaveProperty('normal');
    });

    it('should delete channel object when last user leaves', () => {
      channelManagers[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channelManagers[mockChannelId];
      channel.users = channelUsers();
      delete channel.users.user2;

      channel.userLeft('normal');

      expect(channelManagers).not.toHaveProperty('mockChannelId');
    });

    it('should not throw error when removing non-existent user', () => {
      channelManagers[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channelManagers[mockChannelId];
      channel.users = channelUsers();

      expect(() => channel.userLeft('notExist')).not.toThrow();
    });
  });

  describe('test getSendMesageType', () => {
    it('should throw error when user is not in channel', () => {
      const channel = new ChannelManager(mockChannelId);
      expect(() => channel.getSendMessageType(mockUserId)).toThrow();
    });

    it('should return normal for normal channel', () => {
      const channel = new ChannelManager(mockChannelId);
      channel.users = channelUsers();

      const sendMessageType = channel.getSendMessageType('normal');
      expect(sendMessageType).toBe('normal');
    });

    it('should return normal when phase is finished', () => {
      const channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();
      game.phaseManager.currentPhase = 'finished';

      const sendMessageType = channel.getSendMessageType('normal');
      expect(sendMessageType).toBe('normal');
    });

    it('should return spectator for spectator users', () => {
      const channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();
      game.phaseManager.currentPhase = 'day';

      const sendMessageType = channel.getSendMessageType('spectator');
      expect(sendMessageType).toBe('spectator');
    });

    it('should return normal when not in night phase', () => {
      const channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();
      game.phaseManager.currentPhase = 'day';

      const sendMessageType = channel.getSendMessageType('normal');
      expect(sendMessageType).toBe('normal');
    });

    it('should return werewolf for werewolves during night phase', () => {
      const channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();
      game.phaseManager.currentPhase = 'night';

      const sendMessageType = channel.getSendMessageType('werewolf');
      expect(sendMessageType).toBe('werewolf');
    });

    it('should throw error for non-werewolves during night phase', () => {
      const channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();
      game.phaseManager.currentPhase = 'night';

      expect(() => channel.getSendMessageType('normal')).toThrow();
    });
  });

  describe('test checkCanUserAccessChannel', () => {
    it('should throw error when user is not in channel', () => {
      const channel = new ChannelManager(mockChannelId);
      expect(() => channel.checkCanUserAccessChannel('notExist')).toThrow(
        new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN),
      );
    });
  });

  describe('test getMessageReceivers', () => {
    it('should return empty array for normal message type', () => {
      const channel = new ChannelManager(mockChannelId);
      const messageReceivers = channel.getMessageReceivers('normal');
      expect(messageReceivers).toEqual([]);
    });

    it('should return spectators for spectator message type', () => {
      const channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();

      const messageReceivers = channel.getMessageReceivers('spectator');
      expect(messageReceivers).toEqual(['spectator']);
    });

    it('should return werewolves and spectators for werewolf message type', () => {
      const channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();

      const messageReceivers = channel.getMessageReceivers('werewolf');
      expect(messageReceivers).toEqual(['spectator', 'werewolf']);
    });
  });

  describe('test getReciveMessageType', () => {
    let channel: ChannelManager;

    beforeAll(() => {
      channel = new ChannelManager(mockGameId, game);
      channel.users = channelUsers();
    });

    it('should return undefined for normal channel', () => {
      const normalChanel = new ChannelManager(mockChannelId);
      normalChanel.users = channelUsers();

      const receiveMessageType = normalChanel.getReceiveMessageType('normal');
      expect(receiveMessageType).toBeUndefined();
    });

    it('should throw error when user is not found', () => {
      const normalChanel = new ChannelManager(mockChannelId);
      expect(() => normalChanel.getReceiveMessageType('notExist')).toThrow();
    });

    it('should return undefined for spectator users', () => {
      const receiveMessageType = channel.getReceiveMessageType('spectator');
      expect(receiveMessageType).toBeUndefined();
    });

    it('should return normal for normal users', () => {
      const receiveMessageType = channel.getReceiveMessageType('normal');
      expect(receiveMessageType).toEqual(['normal']);
    });

    it('should return normal and werewolf for werewolf users', () => {
      const receiveMessageType = channel.getReceiveMessageType('werewolf');
      expect(receiveMessageType).toEqual(['normal', 'werewolf']);
    });

    it('should return undefined when game is finished', () => {
      game.phaseManager.currentPhase = 'finished';
      const receiveMessageType = channel.getReceiveMessageType('normal');
      expect(receiveMessageType).toBeUndefined();
    });
  });

  describe('test createChannelInstance', () => {
    beforeEach(async () => {
      await Channel.deleteMany({});
      await Game.deleteMany({});
    });

    it('should create instance when channel exists', async () => {
      const channel = await Channel.create({
        channelName: 'test',
        channelDescription: 'test',
        channelAdmin: mockUserId,
      });
      const channelId = channel._id.toString();

      const channelManager =
        await ChannelManager.createChannelInstance(channelId);
      expect(channelManager).toBeInstanceOf(ChannelManager);
      expect(channelManagers[channelId]).toBe(channelManager);
    });

    it('should create instance when game exists', async () => {
      await Game.create({
        _id: mockGameId,
        channelId: mockChannelId,
      });

      const channelManager =
        await ChannelManager.createChannelInstance(mockGameId);
      expect(channelManager).toBeInstanceOf(ChannelManager);
      expect(channelManagers[mockGameId]).toBe(channelManager);
    });

    it('should throw error when neither channel nor game exists', async () => {
      await expect(
        ChannelManager.createChannelInstance('notExist'),
      ).rejects.toThrow();
    });

    it('should throw error when game does not exist in database', async () => {
      await expect(
        ChannelManager.createChannelInstance(mockGameId),
      ).rejects.toThrow();
    });

    it('should throw error when game instance does not exist', async () => {
      const game = await Game.create({
        channelId: mockChannelId,
      });
      const gameId = game._id.toString();

      await expect(
        ChannelManager.createChannelInstance(gameId),
      ).rejects.toThrow();
    });
  });
});
