import { channelManagers } from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import ChannelManager from '../../src/classes/ChannelManager';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../__mocks__/mockdata';
import { gamePlayers, channelUsers } from '../../__mocks__/mockdata';

const mockSocketId = 'mockSocketId';
let gameManager: GameManager;

beforeAll(async () => {
  gameManager = new GameManager(mockChannelId, mockGameId, mockUsers);
  gameManager.sendMessage = jest.fn();
  gameManager.playerManager.players = gamePlayers;
});

afterAll(() => {
  const timerId = gameManager.phaseManager.timerId;
  if (timerId) clearTimeout(timerId);

  jest.restoreAllMocks();
});

describe('test ChannelManager', () => {
  describe('constructor', () => {
    it('通常のチャンネルで正しく初期化されること', () => {
      const channel = new ChannelManager(mockChannelId);

      expect(channel.channelId).toBe(mockChannelId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeNull;
    });

    it('ゲーム用チャンネルで正しく初期化されること', () => {
      const channel = new ChannelManager(mockGameId, gameManager);

      expect(channel.channelId).toBe(mockGameId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeInstanceOf(GameManager);
    });
  });

  describe('test userJoined', () => {
    it('通常のチャンネルでユーザーがチャンネルに参加できる', async () => {
      const channel = new ChannelManager(mockChannelId);
      await channel.userJoined(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];
      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });

    it('ゲーム用のチャンネルでユーザーがチャンネルに参加できる', async () => {
      const channel = new ChannelManager(mockGameId, gameManager);

      await channel.userJoined('villager', mockSocketId);
      const user = channel.users.villager;

      expect(user.userId).toBe('villager');
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });

    it('ユーザーが人狼のとき', async () => {
      const channel = new ChannelManager(mockGameId, gameManager);

      await channel.userJoined('werewolf', mockSocketId);
      const user = channel.users.werewolf;

      expect(user.userId).toBe('werewolf');
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('werewolf');
    });

    it('ユーザーが死亡しているとき', async () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      gameManager.playerManager.players.villager.status = 'dead';

      await channel.userJoined('villager', mockSocketId);
      const user = channel.users.villager;

      expect(user.userId).toBe('villager');
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('spectator');
    });

    it('ユーザーがゲームに参加していないとき', async () => {
      const channel = new ChannelManager(mockGameId, gameManager);

      await channel.userJoined(mockUserId, mockSocketId);
      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('spectator');
    });
  });

  describe('test userLeft', () => {
    it('ユーザーが退出', async () => {
      channelManagers[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channelManagers[mockChannelId];
      channel.users = channelUsers();

      channel.userLeft('normal');

      expect(channel.users).not.toHaveProperty('normal');
    });

    it('最後のユーザーが退出するとchannelオブジェクトを削除する', () => {
      channelManagers[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channelManagers[mockChannelId];
      channel.users = channelUsers();
      delete channel.users.user2;

      channel.userLeft('normal');

      expect(channelManagers).not.toHaveProperty('mockChannelId');
    });

    it('存在しないユーザーを削除しようとしてもエラーにならない', () => {
      channelManagers[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channelManagers[mockChannelId];
      channel.users = channelUsers();

      expect(() => channel.userLeft('notExist')).not.toThrow();
    });
  });

  describe('test getSendMesageType', () => {
    it('ユーザーがチャンネルにいない場合エラーを返す', () => {
      const channel = new ChannelManager(mockChannelId);
      expect(() => channel.getSendMessageType(mockUserId)).toThrow();
    });

    it('通常のチャンネルのときnormalを返す', () => {
      const channel = new ChannelManager(mockChannelId);
      channel.users = channelUsers();

      const sendMessageType = channel.getSendMessageType('normal');
      expect(sendMessageType).toBe('normal');
    });

    it('finishedフェーズのときnormalを返す', () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();
      gameManager.phaseManager.currentPhase = 'finished';

      const sendMessageType = channel.getSendMessageType('normal');
      expect(sendMessageType).toBe('normal');
    });

    it('ユーザーがspectatorのときspectatorを返す', () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();
      gameManager.phaseManager.currentPhase = 'day';

      const sendMessageType = channel.getSendMessageType('spectator');
      expect(sendMessageType).toBe('spectator');
    });

    it('nightフェーズでないときnormalを返す', () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();
      gameManager.phaseManager.currentPhase = 'day';

      const sendMessageType = channel.getSendMessageType('normal');
      expect(sendMessageType).toBe('normal');
    });

    it('nightフェーズのとき人狼にはwerewolfを返す', () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();
      gameManager.phaseManager.currentPhase = 'night';

      const sendMessageType = channel.getSendMessageType('werewolf');
      expect(sendMessageType).toBe('werewolf');
    });

    it('nightフェーズのとき人狼以外にはエラーを返す', () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();
      gameManager.phaseManager.currentPhase = 'night';

      expect(() => channel.getSendMessageType('normal')).toThrow();
    });
  });

  describe('test checkCanUserAccessChannel', () => {
    it('チャンネルにユーザーがいないときエラーを返す', () => {
      const channel = new ChannelManager(mockChannelId);
      expect(() => channel.checkCanUserAccessChannel('notExist')).toThrow();
    });
  });

  describe('test getMessageReceivers', () => {
    it('メッセージタイプがnormalのときnullを返す', () => {
      const channel = new ChannelManager(mockChannelId);
      const messageReceivers = channel.getMessageReceivers('normal');
      expect(messageReceivers).toBe(null);
    });

    it('メッセージタイプがspectatorのとき観戦者を返す', () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();

      const messageReceivers = channel.getMessageReceivers('spectator');
      expect(messageReceivers).toEqual(['spectator']);
    });

    it('メッセージタイプがwerewolfのとき人狼と観戦者を返す', () => {
      const channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();

      const messageReceivers = channel.getMessageReceivers('werewolf');
      expect(messageReceivers).toEqual(['spectator', 'werewolf']);
    });
  });

  describe('test getReciveMessageType', () => {
    let channel: ChannelManager;

    beforeAll(() => {
      channel = new ChannelManager(mockGameId, gameManager);
      channel.users = channelUsers();
    });

    it('通常のチャンネルのとき', () => {
      const normalChanel = new ChannelManager(mockChannelId);
      normalChanel.users = channelUsers();

      const receiveMessageType = normalChanel.getReceiveMessageType('normal');
      expect(receiveMessageType).toBe(null);
    });

    it('ユーザーが見つからないとき', () => {
      const normalChanel = new ChannelManager(mockChannelId);
      expect(() => normalChanel.getReceiveMessageType('notExist')).toThrow();
    });

    it('ユーザーが観戦者', () => {
      const receiveMessageType = channel.getReceiveMessageType('spectator');
      expect(receiveMessageType).toBe(null);
    });

    it('ユーザーがnormal', () => {
      const receiveMessageType = channel.getReceiveMessageType('normal');
      expect(receiveMessageType).toEqual({ $in: ['normal'] });
    });

    it('ユーザーが人狼', () => {
      const receiveMessageType = channel.getReceiveMessageType('werewolf');
      expect(receiveMessageType).toEqual({ $in: ['normal', 'werewolf'] });
    });

    it('ゲームが終了しているとき', () => {
      gameManager.phaseManager.currentPhase = 'finished';
      const receiveMessageType = channel.getReceiveMessageType('normal');
      expect(receiveMessageType).toBe(null);
    });
  });
});
