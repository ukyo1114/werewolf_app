jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
}));
import { ObjectId } from 'mongodb';
import GameManager from '../../src/classes/GameManager';
import ChannelManager from '../../src/classes/ChannelManager';
import ChannelUserManager from '../../src/classes/ChannelUserManager';
import { channels } from '../../src/classes/ChannelInstanceManager';
import ChannelUser from '../../src/models/channelUserModel';
import GameUser from '../../src/models/gameUserModel';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../jest.setup';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';
import { appState } from '../../src/app';

const { gameManagers } = appState;

const mockSocketId = 'mockSocketId';

beforeAll(async () => {
  await ChannelUser.create({ channelId: mockChannelId, userId: mockUserId });
  await GameUser.create({ gameId: mockGameId, userId: mockUserId });
});

beforeEach(() => {
  gameManagers[mockGameId] = new GameManager(
    mockChannelId,
    mockGameId,
    mockUsers,
  );
  // sendMessageをモック
  gameManagers[mockGameId].sendMessage = jest.fn();
});

afterEach(() => {
  const timerId = gameManagers[mockGameId].phaseManager.timerId;

  if (timerId) {
    clearTimeout(timerId);
  }
});

afterAll(() => {
  delete gameManagers[mockGameId];
  jest.restoreAllMocks();
});

describe('test ChannelManager', () => {
  describe('constructor', () => {
    it('通常のチャンネルでで正しく初期化されること', () => {
      const channel = new ChannelManager(mockChannelId);

      expect(channel.channelId).toBe(mockChannelId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeUndefined();
    });

    it('ゲーム用チャンネルで正しく初期化されること', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);

      expect(channel.channelId).toBe(mockGameId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeInstanceOf(GameManager);
    });
  });

  describe('userJoined', () => {
    it('通常のチャンネルでユーザーがチャンネルに参加できる', async () => {
      const channel = new ChannelManager(mockChannelId);
      await channel.userJoined(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });

    it('通常のチャンネルでデータベースに登録されていないユーザーが参加しようとするとエラーになる', async () => {
      const channel = new ChannelManager(mockChannelId);
      const nonExistingUser = new ObjectId().toString();

      await expect(() =>
        channel.userJoined(nonExistingUser, mockSocketId),
      ).rejects.toThrow(new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN));
    });

    it('ゲーム用のチャンネルでユーザーがチャンネルに参加できる', async () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      game.playerManager.players = {
        [mockUserId]: {
          userId: mockUserId,
          userName: 'mockUser',
          status: 'alive',
          role: 'villager',
        },
      };

      await channel.userJoined(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });

    it('ゲーム用のチャンネルでデータベースに登録されていないユーザーが参加しようとするとエラーになる', async () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      const nonExistingUser = new ObjectId().toString();

      await expect(() =>
        channel.userJoined(nonExistingUser, mockSocketId),
      ).rejects.toThrow(new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN));
    });

    it('ユーザーが人狼のとき', async () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      game.playerManager.players = {
        [mockUserId]: {
          userId: mockUserId,
          userName: 'werewolf',
          status: 'alive',
          role: 'werewolf',
        },
      };

      await channel.userJoined(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('werewolf');
    });

    it('ユーザーが死亡しているとき', async () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      game.playerManager.players = {
        [mockUserId]: {
          userId: mockUserId,
          userName: 'villager',
          status: 'dead',
          role: 'villager',
        },
      };

      await channel.userJoined(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('spectator');
    });

    it('ユーザーがゲームに参加していないとき', async () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);

      await channel.userJoined(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('spectator');
    });
  });

  describe('test userLeft', () => {
    it('ユーザーが退出', async () => {
      channels[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channels[mockChannelId];
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
        user2: new ChannelUserManager({
          userId: 'user2',
          socketId: 'user2',
          status: 'normal',
        }),
      };

      channel.userLeft('user1');

      expect(channel.users).not.toHaveProperty('user1');
      expect(channel.users).toHaveProperty('user2');
    });

    it('最期のユーザーが退出するとchannelオブジェクトを削除する', () => {
      channels[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channels[mockChannelId];
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };

      channel.userLeft('user1');

      expect(channels).not.toHaveProperty('mockChannelId');
    });

    it('存在しないユーザーを削除しようとしてもエラーにならない', () => {
      channels[mockChannelId] = new ChannelManager(mockChannelId);
      const channel = channels[mockChannelId];
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };

      expect(() => channel.userLeft('nonExistentUser')).not.toThrow();
    });

    it('チャンネルがchannelsに登録されていなくてもエラーにならない', () => {
      const channel = new ChannelManager(mockChannelId);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };

      expect(() => channel.userLeft('user1')).not.toThrow();
    });
  });

  describe('test getSendMesageType', () => {
    it('ユーザーがチャンネルにいない場合エラーを返す', () => {
      const channel = new ChannelManager(mockChannelId);

      expect(() => channel.getSendMessageType(mockUserId)).toThrow(
        new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN),
      );
    });

    it('通常のチャンネルのときnormalを返す', () => {
      const channel = new ChannelManager(mockChannelId);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };

      const sendMessageType = channel.getSendMessageType('user1');

      expect(sendMessageType).toBe('normal');
    });

    it('finishedフェーズのときnormalを返す', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };
      game.phaseManager.currentPhase = 'finished';

      const sendMessageType = channel.getSendMessageType('user1');

      expect(sendMessageType).toBe('normal');
    });

    it('ユーザーがspectatorのときspectatorを返す', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'spectator',
        }),
      };
      game.phaseManager.currentPhase = 'day';

      const sendMessageType = channel.getSendMessageType('user1');

      expect(sendMessageType).toBe('spectator');
    });

    it('nightフェーズでないときnormalを返す', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };
      game.phaseManager.currentPhase = 'day';

      const sendMessageType = channel.getSendMessageType('user1');

      expect(sendMessageType).toBe('normal');
    });

    it('nightフェーズのとき人狼にはwerewolfを返す', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'werewolf',
        }),
      };
      game.phaseManager.currentPhase = 'night';

      const sendMessageType = channel.getSendMessageType('user1');

      expect(sendMessageType).toBe('werewolf');
    });

    it('nightフェーズのとき人狼以外にはエラーを返す', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };
      game.phaseManager.currentPhase = 'night';

      expect(() => channel.getSendMessageType('user1')).toThrow(
        new AppError(403, errors.MESSAGE_SENDING_FORBIDDEN),
      );
    });
  });

  describe('test checkCanUserAccessChannel', () => {
    it('チャンネルにユーザーがいないときエラーを返す', () => {
      const channel = new ChannelManager(mockChannelId);

      expect(() => channel.checkCanUserAccessChannel('userId')).toThrow(
        new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN),
      );
    });
  });

  describe('test getMessageReceivers', () => {
    it('メッセージタイプがnormalのときnullを返す', () => {
      const channel = new ChannelManager(mockChannelId);

      const messageReceivers = channel.getMessageReceivers('normal');

      expect(messageReceivers).toBe(null);
    });

    it('メッセージタイプがspectatorのとき観戦者を返す', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
        user2: new ChannelUserManager({
          userId: 'user2',
          socketId: 'user2',
          status: 'werewolf',
        }),
        user3: new ChannelUserManager({
          userId: 'user3',
          socketId: 'user3',
          status: 'spectator',
        }),
      };

      const messageReceivers = channel.getMessageReceivers('spectator');

      expect(messageReceivers).toEqual(['user3']);
    });

    it('メッセージタイプがwerewolfのとき人狼と観戦者を返す', () => {
      const game = gameManagers[mockGameId];
      const channel = new ChannelManager(mockGameId, game);
      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
        user2: new ChannelUserManager({
          userId: 'user2',
          socketId: 'user2',
          status: 'werewolf',
        }),
        user3: new ChannelUserManager({
          userId: 'user3',
          socketId: 'user3',
          status: 'spectator',
        }),
      };

      const messageReceivers = channel.getMessageReceivers('werewolf');

      expect(messageReceivers).toEqual(['user3', 'user2']);
    });
  });

  describe('test getReciveMessageType', () => {
    let game: GameManager;
    let channel: ChannelManager;

    beforeAll(() => {
      game = gameManagers[mockGameId];
      channel = new ChannelManager(mockGameId, game);

      channel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
        user2: new ChannelUserManager({
          userId: 'user2',
          socketId: 'user2',
          status: 'werewolf',
        }),
        user3: new ChannelUserManager({
          userId: 'user3',
          socketId: 'user3',
          status: 'spectator',
        }),
      };
    });

    it('通常のチャンネルのとき', () => {
      const normalChanel = new ChannelManager(mockChannelId);

      normalChanel.users = {
        user1: new ChannelUserManager({
          userId: 'user1',
          socketId: 'user1',
          status: 'normal',
        }),
      };

      const receiveMessageType = normalChanel.getReceiveMessageType('user1');
      expect(receiveMessageType).toBe(null);
    });

    it('ユーザーが見つからないとき', () => {
      const normalChanel = new ChannelManager(mockChannelId);

      expect(() => normalChanel.getReceiveMessageType('user1')).toThrow(
        new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN),
      );
    });

    it('ユーザーが観戦者', () => {
      const receiveMessageType = channel.getReceiveMessageType('user3');

      expect(receiveMessageType).toBe(null);
    });

    it('ユーザーがnormal', () => {
      const receiveMessageType = channel.getReceiveMessageType('user1');

      expect(receiveMessageType).toEqual({ $in: ['normal'] });
    });

    it('ユーザーが人狼', () => {
      const receiveMessageType = channel.getReceiveMessageType('user2');

      expect(receiveMessageType).toEqual({ $in: ['normal', 'werewolf'] });
    });

    it('ゲームが終了しているとき', () => {
      game.phaseManager.currentPhase = 'finished';
      const receiveMessageType = channel.getReceiveMessageType('user1');

      expect(receiveMessageType).toBe(null);
    });
  });
});
