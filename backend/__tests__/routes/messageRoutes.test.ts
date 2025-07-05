import mongoose from 'mongoose';
import app, { appState, Events } from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import Game from '../../src/models/Game';
import ChannelUser from '../../src/models/ChannelUser';
import Message from '../../src/models/Message';
import {
  mockChannelId,
  mockUserId,
  mockGameId,
  mockUsers,
} from '../../__mocks__/mockdata';
import { errors, validation } from '../../src/config/messages';
import ChannelUserManager from '../../src/classes/ChannelUserManager';
import ChannelManager from '../../src/classes/ChannelManager';
import GameManager from '../../src/classes/GameManager';
import { genUserToken } from '../../src/utils/generateToken';
import { ObjectId } from 'mongodb';

describe('test messageRoutes', () => {
  const { gameManagers, channelManagers } = appState;
  const testUserId = new ObjectId().toString();
  const testUser2Id = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();

  beforeAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Channel.deleteMany({}),
      ChannelUser.deleteMany({}),
      Message.deleteMany({}),
    ]);

    await Promise.all([
      User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
      User.create({
        _id: testUser2Id,
        userName: 'testUser2',
        email: 'test2@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
      Channel.create({
        _id: testChannelId,
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        channelAdmin: testUserId,
      }),
      ChannelUser.create({
        channelId: testChannelId,
        userId: testUserId,
      }),
    ]);

    channelManagers[testChannelId] = new ChannelManager(testChannelId);
    channelManagers[testChannelId].users = {
      [testUserId]: new ChannelUserManager({
        userId: testUserId,
        socketId: 'testUser',
        status: 'normal',
      }),
    };
  });

  beforeEach(() => {
    gameManagers[mockGameId] = new GameManager(
      testChannelId,
      mockGameId,
      mockUsers,
    );
    channelManagers[mockGameId] = new ChannelManager(
      mockGameId,
      gameManagers[mockGameId],
    );
  });

  afterEach(async () => {
    const timerId = gameManagers[mockGameId]?.phaseManager.timerId;

    if (timerId) clearTimeout(timerId);
    delete gameManagers[mockGameId];
    delete channelManagers[mockGameId];
    await Message.deleteMany({});
    //jest.restoreAllMocks();
  });

  afterAll(() => {
    app.close();
  });

  describe('getMessages', () => {
    const customRequest = async (
      userId: string,
      channelId: string | undefined,
      status: number,
      messageId?: string,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/message/${channelId}`)
        .query({ messageId })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response.body;
    };

    it('メッセージを取得', async () => {
      await Message.create({
        channelId: testChannelId,
        userId: testUserId,
        message: 'test',
      });

      const messages = await customRequest(testUserId, testChannelId, 200);
      expect(messages[0].channelId).toBe(testChannelId);
    });

    it('チャンネルが存在しないとき', async () => {
      await customRequest(
        testUserId,
        mockChannelId,
        403,
        undefined,
        errors.CHANNEL_ACCESS_FORBIDDEN,
      );
    });

    it('メッセージが存在しないとき空の配列を返す', async () => {
      const messages = await customRequest(testUserId, testChannelId, 200);

      expect(messages).toEqual([]);
    });

    it('メッセージIDを指定して過去のメッセージを取得', async () => {
      let messageId: string;

      const [message] = await Promise.all([
        Message.create({
          channelId: testChannelId,
          userId: testUserId,
          message: 'testMessage',
        }),
        Message.create({
          channelId: testChannelId,
          userId: testUserId,
          message: 'oldMessage',
          createdAt: new Date(Date.now() - 10000),
        }),
      ]);

      messageId = message._id.toString();

      const messages = await customRequest(
        testUserId,
        testChannelId,
        200,
        messageId,
      );

      expect(messages[0].message).toBe('oldMessage');
    });

    it('ユーザーがチャンネルに参加していないとき', async () => {
      await customRequest(
        testUser2Id,
        testChannelId,
        403,
        undefined,
        errors.CHANNEL_ACCESS_FORBIDDEN,
      );
    });

    it('ゲームが終了していると全てのメッセージを取得できる', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'finished';

      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'normal',
        }),
      };

      await Promise.all([
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'normalMessage',
          messageType: 'normal',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'spectateMessage',
          messageType: 'spectator',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'werewolfMessage',
          messageType: 'werewolf',
        }),
      ]);

      const messages = await customRequest(testUserId, mockGameId, 200);

      expect(messages).toHaveLength(3);
    });

    it('観戦者は全てのメッセージを取得できる', async () => {
      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'spectator',
        }),
      };

      await Promise.all([
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'normalMessage',
          messageType: 'normal',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'spectateMessage',
          messageType: 'spectator',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'werewolfMessage',
          messageType: 'werewolf',
        }),
      ]);

      const messages = await customRequest(testUserId, mockGameId, 200);

      expect(messages).toHaveLength(3);
    });

    it('人狼は人狼用メッセージを取得できる', async () => {
      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'werewolf',
        }),
      };

      await Promise.all([
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'normalMessage',
          messageType: 'normal',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'spectateMessage',
          messageType: 'spectator',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'werewolfMessage',
          messageType: 'werewolf',
        }),
      ]);

      const messages = await customRequest(testUserId, mockGameId, 200);

      expect(messages).toHaveLength(2);
    });

    it('通常プレイヤーは通常メッセージのみ取得できる', async () => {
      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'normal',
        }),
      };

      await Promise.all([
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'normalMessage',
          messageType: 'normal',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'spectateMessage',
          messageType: 'spectator',
        }),
        Message.create({
          channelId: mockGameId,
          userId: testUserId,
          message: 'werewolfMessage',
          messageType: 'werewolf',
        }),
      ]);

      const messages = await customRequest(testUserId, mockGameId, 200);
      expect(messages).toHaveLength(1);
    });

    it('リクエストにchannelIDが含まれていない時', async () => {
      await customRequest(
        testUserId,
        undefined,
        400,
        undefined,
        validation.INVALID_CHANNEL_ID,
      );
    });

    it('channelIDの形式がmongoIdでないとき', async () => {
      await customRequest(
        testUserId,
        'wrongChannelId',
        400,
        undefined,
        validation.INVALID_CHANNEL_ID,
      );
    });

    it('messageIDの形式がmongoIdでないとき', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        400,
        'wrongMessageId',
        validation.INVALID_MESSAGE_ID,
      );
    });
  });

  describe('test sendMessage', () => {
    const { channelEvents } = Events;
    const emitSpy = jest.spyOn(channelEvents, 'emit');
    const customRequest = async (
      userId: string,
      channelId: string | undefined,
      message: string | undefined,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .post(`/api/message/${channelId}`)
        .send({ message })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
    };

    it('メッセージを送信', async () => {
      await customRequest(testUserId, testChannelId, 'testMessage', 200);

      const messages = await Message.find({ channelId: testChannelId });
      expect(messages[0].message).toBe('testMessage');

      expect(emitSpy).toHaveBeenCalledWith(
        'newMessage',
        testChannelId,
        expect.any(Object),
        [],
      );
    });

    it('チャンネルが存在しない時', async () => {
      await customRequest(
        testUserId,
        mockChannelId,
        'testMessage',
        403,
        errors.CHANNEL_ACCESS_FORBIDDEN,
      );
    });

    it('ユーザーがチャンネルに参加していないとき', async () => {
      await customRequest(
        testUser2Id,
        testChannelId,
        'testMessage',
        403,
        errors.MESSAGE_SENDING_FORBIDDEN,
      );
    });

    it('ゲームが終了しているとメッセージタイプ通常になる', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'finished';

      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'normal',
        }),
      };

      await customRequest(testUserId, mockGameId, 'testMessage', 200);

      const messages = await Message.find({ channelId: mockGameId });
      expect(messages[0].messageType).toBe('normal');
    });

    it('ユーザーが観戦者の時メッセージタイプが観戦になる', async () => {
      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'spectator',
        }),
      };

      await customRequest(testUserId, mockGameId, 'testMessage', 200);

      const messages = await Message.find({ channelId: mockGameId });
      expect(messages[0].messageType).toBe('spectator');
    });

    it('夜フェーズ時ユーザーが人狼だとメッセージタイプが人狼になる', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'werewolf',
        }),
      };

      await customRequest(testUserId, mockGameId, 'testMessage', 200);

      const messages = await Message.find({ channelId: mockGameId });
      expect(messages[0].messageType).toBe('werewolf');
    });

    it('夜フェーズ時ユーザーが通常だとエラーになる', async () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      channelManagers[mockGameId].users = {
        [testUserId]: new ChannelUserManager({
          userId: testUserId,
          socketId: 'testUser',
          status: 'normal',
        }),
      };

      await customRequest(
        testUserId,
        mockGameId,
        'testMessage',
        403,
        errors.MESSAGE_SENDING_FORBIDDEN,
      );
    });

    it('メッセージが存在しないとき', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        undefined,
        400,
        validation.MESSAGE_LENGTH,
      );
    });

    it('メッセージが空文字', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        '',
        400,
        validation.MESSAGE_LENGTH,
      );
    });

    it('メッセージが長すぎる', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        'a'.repeat(401),
        400,
        validation.MESSAGE_LENGTH,
      );
    });
  });
});
