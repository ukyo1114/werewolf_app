import { ObjectId } from 'mongodb';
import app, { Events } from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import ChannelUser from '../../src/models/ChannelUser';
import ChannelBlockUser from '../../src/models/ChannelBlockUser';
import { mockChannelId, mockUserId } from '../../__mocks__/mockdata';
import { errors, validation } from '../../src/config/messages';
import { genUserToken } from '../../src/utils/generateToken';

describe('test channelRoutes', () => {
  const { channelEvents } = Events;
  const testUserId = new ObjectId().toString();
  const guestUserId = new ObjectId().toString();
  const blockedUserId = new ObjectId().toString();
  const emitSpy = jest.spyOn(channelEvents, 'emit');

  beforeAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Channel.deleteMany({}),
      ChannelUser.deleteMany({}),
      ChannelBlockUser.deleteMany({}),
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
        _id: guestUserId,
        userName: 'guestUser',
        email: 'guest@example.com',
        password: 'password123',
        pic: null,
        isGuest: true,
      }),
      User.create({
        _id: blockedUserId,
        userName: 'blockedUser',
        email: 'blocked@example.com',
        password: 'password123',
        pic: null,
        isGuest: true,
      }),
    ]);
  });

  beforeEach(async () => {
    emitSpy.mockClear();
  });

  afterAll(() => {
    app.close();
  });

  describe('/list', () => {
    beforeEach(async () => {
      await Promise.all([
        await Channel.deleteMany({}),
        await ChannelUser.deleteMany({}),
        await ChannelBlockUser.deleteMany({}),
      ]);
    });

    it('チャンネルリストを取得する', async () => {
      const mockToken = genUserToken(testUserId);
      const testChannelId = new ObjectId().toString();
      const joinedChannelId = new ObjectId().toString();
      const blockedChannelId = new ObjectId().toString();

      await Promise.all([
        Channel.create({
          _id: testChannelId,
          channelName: 'testChannel1',
          channelDescription: 'testDescription',
          channelAdmin: testUserId,
        }),
        ChannelUser.create({ channelId: joinedChannelId, userId: testUserId }),
        ChannelBlockUser.create({
          channelId: blockedChannelId,
          userId: testUserId,
        }),
      ]);

      const response = await request(app)
        .get('/api/channel/list')
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.channelList).toEqual([
        {
          _id: testChannelId,
          channelName: 'testChannel1',
          channelDescription: 'testDescription',
          channelAdmin: {
            _id: testUserId,
            userName: 'testUser',
            pic: null,
          },
          denyGuests: false,
          passwordEnabled: false,
          numberOfPlayers: 10,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ]);
      expect(response.body.joinedChannels).toEqual([joinedChannelId]);
      expect(response.body.blockedChannels).toEqual([blockedChannelId]);
    });

    it('チャンネルが存在しないとき', async () => {
      const mockToken = genUserToken(testUserId);
      const response = await request(app)
        .get('/api/channel/list')
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.channelList).toEqual([]);
      expect(response.body.joinedChannels).toEqual([]);
      expect(response.body.blockedChannels).toEqual([]);
    });

    it('ユーザーが未登録のときエラーを返す', async () => {
      const mockToken = genUserToken(mockUserId);
      const response = await request(app)
        .get('/api/channel/list')
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
    });
  });

  describe('/create', () => {
    beforeEach(async () => {
      await Promise.all([
        await Channel.deleteMany({}),
        await ChannelUser.deleteMany({}),
      ]);
    });

    it('チャンネルを作成する', async () => {
      const mockToken = genUserToken(testUserId);
      const requestBody = {
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        passwordEnabled: false,
        password: null,
        denyGuests: false,
        numberOfPlayers: 10,
      };

      const response = await request(app)
        .post('/api/channel/create')
        .send(requestBody)
        .set('authorization', `Bearer ${mockToken}`)
        .expect(201);

      expect(response.body.channelId).toBeDefined();

      const createdChannelId = response.body.channelId;
      const createdChannel = await Channel.findById(createdChannelId);
      expect(createdChannel).not.toBeNull();

      const channelUserEntry = await ChannelUser.findOne({
        channelId: createdChannelId,
        userId: testUserId,
      });
      expect(channelUserEntry).not.toBeNull();
    });

    it('パスワード設定できる', async () => {
      const mockToken = genUserToken(testUserId);
      const requestBody = {
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        passwordEnabled: true,
        password: 'a'.repeat(8),
        denyGuests: false,
        numberOfPlayers: 10,
      };

      const response = await request(app)
        .post('/api/channel/create')
        .send(requestBody)
        .set('authorization', `Bearer ${mockToken}`)
        .expect(201);

      expect(response.body.channelId).toBeDefined();

      const createdChannelId = response.body.channelId;
      const createdChannel = await Channel.findById(createdChannelId);
      expect(createdChannel).not.toBeNull();
      expect(createdChannel?.passwordEnabled).toBe(true);
      expect(createdChannel?.password).not.toBeNull();
    });

    it('パスワード設定を無効にしていればパスワードを送信しても設定されない', async () => {
      const mockToken = genUserToken(testUserId);
      const requestBody = {
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        passwordEnabled: false,
        password: 'a'.repeat(8),
        denyGuests: false,
        numberOfPlayers: 10,
      };

      const response = await request(app)
        .post('/api/channel/create')
        .send(requestBody)
        .set('authorization', `Bearer ${mockToken}`)
        .expect(201);

      expect(response.body.channelId).toBeDefined();

      const createdChannelId = response.body.channelId;
      const createdChannel = await Channel.findById(createdChannelId);
      expect(createdChannel).not.toBeNull();
      expect(createdChannel?.passwordEnabled).toBe(false);
      expect(createdChannel?.password).toBeNull();
    });

    it('ゲストユーザーがチャンネルを作成しようとするとエラーになる', async () => {
      const mockToken = genUserToken(guestUserId);
      const requestBody = {
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        passwordEnabled: false,
        password: null,
        denyGuests: false,
        numberOfPlayers: 10,
      };

      const response = await request(app)
        .post('/api/channel/create')
        .send(requestBody)
        .set('authorization', `Bearer ${mockToken}`)
        .expect(403);

      expect(response.body).toHaveProperty(
        'message',
        errors.GUEST_CREATE_CHANNEL_DENIED,
      );
    });

    it('ユーザーが未登録のときエラーを返す', async () => {
      const mockToken = genUserToken(mockUserId);
      const requestBody = {
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        passwordEnabled: false,
        password: null,
        denyGuests: false,
        numberOfPlayers: 10,
      };

      const response = await request(app)
        .post('/api/channel/create')
        .send(requestBody)
        .set('authorization', `Bearer ${mockToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
    });

    test.each([
      [
        'チャンネル名が空',
        {
          channelName: '',
          channelDescription: 'testDescription',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.CHANNEL_NAME_LENGTH,
      ],
      [
        'チャンネル名が長すぎる',
        {
          channelName: 'a'.repeat(21),
          channelDescription: 'testDescription',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.CHANNEL_NAME_LENGTH,
      ],
      [
        'チャンネル名がnull',
        {
          channelName: null,
          channelDescription: 'testDescription',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.CHANNEL_NAME_LENGTH,
      ],
      [
        '説明文が空',
        {
          channelName: 'testChannel',
          channelDescription: '',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.CHANNEL_DESCRIPTION_LENGTH,
      ],
      [
        '説明文が長すぎる',
        {
          channelName: 'testChannel',
          channelDescription: 'a'.repeat(2001),
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.CHANNEL_DESCRIPTION_LENGTH,
      ],
      [
        '説明文がnull',
        {
          channelName: 'testChannel',
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.CHANNEL_DESCRIPTION_LENGTH,
      ],
      [
        'パスワード有効化がnull',
        {
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          passwordEnabled: null,
          password: '12345678',
          denyGuests: false,
          numberOfPlayers: 10,
        },
        'Invalid value',
      ],
      [
        'パスワードが短すぎる',
        {
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          passwordEnabled: true,
          password: '1234567',
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.PASSWORD_LENGTH,
      ],
      [
        'パスワードが長すぎる',
        {
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          passwordEnabled: true,
          password: 'a'.repeat(65),
          denyGuests: false,
          numberOfPlayers: 10,
        },
        validation.PASSWORD_LENGTH,
      ],
      [
        'プレイヤー数がundefined',
        {
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: undefined,
        },
        validation.NUMBER_OF_PLAYERS,
      ],
      [
        'プレイヤー数が少なすぎる',
        {
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 4,
        },
        validation.NUMBER_OF_PLAYERS,
      ],
      [
        'プレイヤー数が多すぎる',
        {
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 21,
        },
        validation.NUMBER_OF_PLAYERS,
      ],
    ])('%s', async (_, requestBody, errorMessage) => {
      const mockToken = genUserToken(testUserId);
      const response = await request(app)
        .post('/api/channel/create')
        .send(requestBody)
        .set('authorization', `Bearer ${mockToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', errorMessage);
    });
  });

  describe('/settings, /join, /left', () => {
    const testChannelId = new ObjectId().toString();
    const passwordChannelId = new ObjectId().toString();
    const denyGuestsChannelId = new ObjectId().toString();

    beforeEach(async () => {
      await Channel.deleteMany({});
      await Promise.all([
        Channel.create({
          _id: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          channelAdmin: testUserId,
        }),
        Channel.create({
          _id: passwordChannelId,
          channelName: 'passwordChannel',
          channelDescription: 'testDescription',
          password: 'testPassword',
          passwordEnabled: true,
          channelAdmin: testUserId,
        }),
        Channel.create({
          _id: denyGuestsChannelId,
          channelName: 'denyGuestsChannel',
          channelDescription: 'testDescription',
          channelAdmin: testUserId,
          denyGuests: true,
        }),
      ]);
    });

    describe('/settings', () => {
      it('チャンネル名を変更', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: 'channgedChannel',
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: testChannelId,
          channelName: 'channgedChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(testChannelId);
        expect(testChannel?.channelName).toBe(requestBody.channelName);
      });

      it('説明文を変更', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: 'changedDescription',
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'changedDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(testChannelId);
        expect(testChannel?.channelDescription).toBe(
          requestBody.channelDescription,
        );
      });

      it('パスワードを設定', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          password: 'testPassword',
          passwordEnabled: true,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(testChannelId);
        expect(testChannel?.password).toMatch(/^\$2[abxy]\$.{56}$/);
        expect(testChannel?.passwordEnabled).toBe(true);
      });

      it('パスワードを変更する', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          password: 'changedPassword',
          passwordEnabled: true,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        const passwordChannel = await Channel.findById(passwordChannelId);
        const passwordBeforeChange = passwordChannel?.password;

        await request(app)
          .put(`/api/channel/settings/${passwordChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: passwordChannelId,
          channelName: 'passwordChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(passwordChannelId);
        expect(testChannel?.password).toMatch(/^\$2[abxy]\$.{56}$/);
        expect(testChannel?.password).not.toBe(passwordBeforeChange);
        expect(testChannel?.passwordEnabled).toBe(true);
      });

      it('パスワードを送信しなければパスワードが変更されない', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          passwordEnabled: true,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        const passwordChannel = await Channel.findById(passwordChannelId);
        const passwordBeforeChange = passwordChannel?.password;

        await request(app)
          .put(`/api/channel/settings/${passwordChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: passwordChannelId,
          channelName: 'passwordChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(passwordChannelId);
        expect(testChannel?.password).toBe(passwordBeforeChange);
        expect(testChannel?.passwordEnabled).toBe(true);
      });

      it('パスワードを有効化しなければパスワードを送信しても設定されない', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          password: 'testPassword',
          passwordEnabled: false,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(testChannelId);
        expect(testChannel?.password).toBeNull();
        expect(testChannel?.passwordEnabled).toBe(false);
      });

      it('パスワードを送信しなければパスワードが有効化されない', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          passwordEnabled: true,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(testChannelId);
        expect(testChannel?.password).toBeNull();
        expect(testChannel?.passwordEnabled).toBe(false);
      });

      it('パスワードを削除', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${passwordChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: passwordChannelId,
          channelName: 'passwordChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const passwordChannel = await Channel.findById(passwordChannelId);
        expect(passwordChannel?.password).toBeNull();
        expect(passwordChannel?.passwordEnabled).toBe(false);
      });

      it('パスワードを無効化すればパスワードを送信しても設定されない', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          password: 'testPassword',
          passwordEnabled: false,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${passwordChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: passwordChannelId,
          channelName: 'passwordChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const passwordChannel = await Channel.findById(passwordChannelId);
        expect(passwordChannel?.password).toBeNull();
        expect(passwordChannel?.passwordEnabled).toBe(false);
      });

      it('ゲスト許可を変更', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: true,
          numberOfPlayers: 10,
        };

        await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 10,
        });

        const testChannel = await Channel.findById(testChannelId);
        expect(testChannel?.denyGuests).toBe(true);
      });

      it('ユーザー数を変更', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: null,
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 5,
        };

        await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);
        expect(emitSpy).toHaveBeenCalledWith('channelSettingsUpdated', {
          channelId: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          numberOfPlayers: 5,
        });

        const testChannel = await Channel.findById(testChannelId);
        expect(testChannel?.numberOfPlayers).toBe(requestBody.numberOfPlayers);
      });

      it('管理者でないときエラーを返す', async () => {
        const mockToken = genUserToken(guestUserId);
        const requestBody = {
          channelName: 'channgedChannel',
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        const response = await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(403);
        expect(emitSpy).not.toHaveBeenCalled();

        expect(response.body).toHaveProperty(
          'message',
          errors.PERMISSION_DENIED,
        );
      });

      it('チャンネルが見つからない時エラーを返す', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: 'channgedChannel',
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        const response = await request(app)
          .put(`/api/channel/settings/${mockChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(404);
        expect(emitSpy).not.toHaveBeenCalled();
        expect(response.body).toHaveProperty(
          'message',
          errors.CHANNEL_NOT_FOUND,
        );
      });

      it('ユーザーが見つからない時エラーを返す', async () => {
        const mockToken = genUserToken(mockUserId);
        const requestBody = {
          channelName: 'channgedChannel',
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        const response = await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(401);
        expect(emitSpy).not.toHaveBeenCalled();
        expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
      });

      it('チャンネルIDがmongoIdでないとエラーになる', async () => {
        const mockToken = genUserToken(testUserId);
        const requestBody = {
          channelName: 'channgedChannel',
          channelDescription: null,
          passwordEnabled: false,
          password: null,
          denyGuests: false,
          numberOfPlayers: 10,
        };

        const response = await request(app)
          .put('/api/channel/settings/wrongId')
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(400);
        expect(emitSpy).not.toHaveBeenCalled();
        expect(response.body).toHaveProperty(
          'message',
          validation.INVALID_CHANNEL_ID,
        );
      });

      test.each([
        [
          'チャンネル名が空',
          {
            channelName: '',
            channelDescription: null,
            passwordEnabled: false,
            password: null,
            denyGuests: false,
            numberOfPlayers: 10,
          },
          validation.CHANNEL_NAME_LENGTH,
        ],
        [
          'チャンネル名が長すぎる',
          {
            channelName: 'a'.repeat(21),
            channelDescription: null,
            passwordEnabled: false,
            password: null,
            denyGuests: false,
            numberOfPlayers: 10,
          },
          validation.CHANNEL_NAME_LENGTH,
        ],
        [
          '説明文が空',
          {
            channelDescription: '',
            passwordEnabled: false,
            password: null,
            denyGuests: false,
            numberOfPlayers: 10,
          },
          validation.CHANNEL_DESCRIPTION_LENGTH,
        ],
        [
          '説明文が長すぎる',
          {
            channelDescription: 'a'.repeat(2001),
            passwordEnabled: false,
            password: null,
            denyGuests: false,
            numberOfPlayers: 10,
          },
          validation.CHANNEL_DESCRIPTION_LENGTH,
        ],
        [
          'パスワードが短すぎる',
          {
            channelName: null,
            channelDescription: null,
            passwordEnabled: true,
            password: '1234567',
            denyGuests: false,
            numberOfPlayers: 10,
          },
          validation.PASSWORD_LENGTH,
        ],
        [
          'パスワードが長すぎる',
          {
            channelName: null,
            channelDescription: null,
            passwordEnabled: true,
            password: 'a'.repeat(65),
            denyGuests: false,
            numberOfPlayers: 10,
          },
          validation.PASSWORD_LENGTH,
        ],
        [
          'プレイヤー数がundefined',
          {
            channelName: null,
            channelDescription: null,
            passwordEnabled: false,
            password: null,
            denyGuests: false,
            numberOfPlayers: undefined,
          },
          validation.NUMBER_OF_PLAYERS,
        ],
        [
          'プレイヤー数が少なすぎる',
          {
            channelName: null,
            channelDescription: null,
            passwordEnabled: false,
            password: null,
            denyGuests: false,
            numberOfPlayers: 4,
          },
          validation.NUMBER_OF_PLAYERS,
        ],
        [
          'プレイヤー数が多すぎる',
          {
            channelName: null,
            channelDescription: null,
            passwordEnabled: false,
            password: null,
            denyGuests: false,
            numberOfPlayers: 21,
          },
          validation.NUMBER_OF_PLAYERS,
        ],
      ])('%s', async (_, requestBody, errorMessage) => {
        const mockToken = genUserToken(testUserId);

        const response = await request(app)
          .put(`/api/channel/settings/${testChannelId}`)
          .send(requestBody)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('message', errorMessage);
        expect(emitSpy).not.toHaveBeenCalled();
      });
    });

    describe('/join', () => {
      beforeEach(async () => {
        await Promise.all([
          ChannelUser.create({
            channelId: testChannelId,
            userId: testUserId,
          }),
          ChannelBlockUser.create({
            channelId: testChannelId,
            userId: blockedUserId,
          }),
        ]);
      });

      afterEach(async () => {
        await Promise.all([
          ChannelUser.deleteMany({}),
          ChannelBlockUser.deleteMany({}),
        ]);
      });

      it('チャンネルに参加できる', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .put(`/api/channel/join/${testChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body.channelName).toBe('testChannel');
        expect(response.body.channelDescription).toBe('testDescription');
        expect(response.body.channelAdmin).toBe(testUserId);
        expect(response.body.channelUsers).toEqual([
          { _id: testUserId, userName: 'testUser', pic: null },
          { _id: guestUserId, userName: 'guestUser', pic: null },
        ]);
        expect(emitSpy).toHaveBeenCalledWith('userJoined', {
          channelId: testChannelId,
          user: {
            _id: new ObjectId(guestUserId),
            userName: 'guestUser',
            pic: null,
          },
        });
      });

      it('パスワード認証に成功する', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .put(`/api/channel/join/${passwordChannelId}`)
          .send({ password: 'testPassword' })
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body.channelName).toBe('passwordChannel');
        expect(response.body.channelDescription).toBe('testDescription');
        expect(response.body.channelAdmin).toBe(testUserId);
        expect(response.body.channelUsers).toEqual([
          { _id: guestUserId.toString(), userName: 'guestUser', pic: null },
        ]);
        expect(emitSpy).toHaveBeenCalledWith('userJoined', {
          channelId: passwordChannelId,
          user: {
            _id: new ObjectId(guestUserId),
            userName: 'guestUser',
            pic: null,
          },
        });
      });

      it('ブロックされているときエラーを返す', async () => {
        const mockToken = genUserToken(blockedUserId);
        const response = await request(app)
          .put(`/api/channel/join/${testChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message', errors.USER_BLOCKED);
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('ユーザーが未登録のときエラーを返す', async () => {
        const mockToken = genUserToken(mockUserId);
        const response = await request(app)
          .put(`/api/channel/join/${testChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(401);

        expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('チャンネルが見つからないときエラーを返す', async () => {
        const mockToken = genUserToken(testUserId);
        const response = await request(app)
          .put(`/api/channel/join/${mockChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(404);

        expect(response.body).toHaveProperty(
          'message',
          errors.CHANNEL_NOT_FOUND,
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('チャンネルに既に参加中の時', async () => {
        const mockToken = genUserToken(testUserId);
        const response = await request(app)
          .put(`/api/channel/join/${testChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body.channelName).toBe('testChannel');
        expect(response.body.channelDescription).toBe('testDescription');
        expect(response.body.channelAdmin).toBe(testUserId);
        expect(response.body.channelUsers).toEqual([
          { _id: testUserId, userName: 'testUser', pic: null },
        ]);
        expect(emitSpy).toHaveBeenCalledWith('userJoined', {
          channelId: testChannelId,
          user: {
            _id: new ObjectId(testUserId),
            userName: 'testUser',
            pic: null,
          },
        });
      });

      it('ゲスト禁止のチャンネルにゲストアカウントで参加しようとしたときエラーを返す', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .put(`/api/channel/join/${denyGuestsChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(403);

        expect(response.body).toHaveProperty(
          'message',
          errors.GUEST_ENTRY_DENIED,
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('パスワードを間違えるとエラーを返す', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .put(`/api/channel/join/${passwordChannelId}`)
          .send({ password: 'wrongPassword' })
          .set('authorization', `Bearer ${mockToken}`)
          .expect(401);

        expect(response.body).toHaveProperty('message', errors.WRONG_PASSWORD);
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('パスワードを送信しないとエラーを返す', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .put(`/api/channel/join/${passwordChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(401);

        expect(response.body).toHaveProperty('message', errors.WRONG_PASSWORD);
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('チャンネルIDがmongoIdでないとエラーを返す', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .put('/api/channel/join/wrongId')
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(400);

        expect(response.body).toHaveProperty(
          'message',
          validation.INVALID_CHANNEL_ID,
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });

      test.each([
        ['パスワードが短すぎる', { password: 'a'.repeat(7) }],
        ['パスワードが長すぎる', { password: 'a'.repeat(65) }],
      ])('%s', async (_, password) => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .put(`/api/channel/join/${passwordChannelId}`)
          .send(password)
          .set('authorization', `Bearer ${mockToken}`)
          .expect(400);

        expect(response.body).toHaveProperty(
          'message',
          validation.PASSWORD_LENGTH,
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });
    });

    describe('/leave', () => {
      beforeEach(async () => {
        await Promise.all([
          ChannelUser.create({
            channelId: testChannelId,
            userId: testUserId,
          }),
          ChannelUser.create({
            channelId: testChannelId,
            userId: guestUserId,
          }),
        ]);
      });

      afterEach(async () => {
        await ChannelUser.deleteMany({});
      });

      it('チャンネルから退出', async () => {
        const mockToken = genUserToken(guestUserId);
        await request(app)
          .delete(`/api/channel/leave/${testChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(200);

        const leftUser = await ChannelUser.findOne({
          channelId: testChannelId,
          userId: guestUserId,
        });

        expect(leftUser).toBeNull();
        expect(emitSpy).toHaveBeenCalledWith('userLeft', {
          channelId: testChannelId,
          userId: guestUserId,
        });
      });

      it('管理者は退出できない', async () => {
        const mockToken = genUserToken(testUserId);
        const response = await request(app)
          .delete(`/api/channel/leave/${testChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(403);

        expect(response.body).toHaveProperty(
          'message',
          errors.ADMIN_LEAVE_DENIED,
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('ユーザーが未登録のとき', async () => {
        const mockToken = genUserToken(mockUserId);
        const response = await request(app)
          .delete(`/api/channel/leave/${testChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(401);

        expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('ユーザーが既に退出済みのとき', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .delete(`/api/channel/leave/${passwordChannelId}`)
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(400);

        expect(response.body).toHaveProperty(
          'message',
          errors.USER_ALREADY_LEFT,
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });

      it('チャンネルIDがmongoIdでないとエラーを返す', async () => {
        const mockToken = genUserToken(guestUserId);
        const response = await request(app)
          .delete('/api/channel/leave/wrongId')
          .send()
          .set('authorization', `Bearer ${mockToken}`)
          .expect(400);

        expect(response.body).toHaveProperty(
          'message',
          validation.INVALID_CHANNEL_ID,
        );
        expect(emitSpy).not.toHaveBeenCalled();
      });
    });
  });
});
