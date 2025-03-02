jest.mock('../../src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));

import { ObjectId } from 'mongodb';
import app from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/userModel';
import Channel from '../../src/models/channelModel';
import ChannelUser from '../../src/models/channelUserModel';
import ChannelBlockUser from '../../src/models/channelBlockUserModel';
import { mockChannelId, mockUserId } from '../../jest.setup';
import { errors, validation } from '../../src/config/messages';

let testUserId: string;
let guestUserId: string;
let blockedUserId: string;

beforeAll(async () => {
  const [testUser, guestUser, blockedUser] = await Promise.all([
    User.create({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    }),
    User.create({
      userName: 'guestUser',
      email: 'guest@example.com',
      password: 'password123',
      pic: null,
      isGuest: true,
    }),
    User.create({
      userName: 'blockedUser',
      email: 'glocked@example.com',
      password: 'password123',
      pic: null,
      isGuest: true,
    }),
  ]);

  testUserId = testUser._id.toString();
  guestUserId = guestUser._id.toString();
  blockedUserId = blockedUser._id.toString();
});

beforeEach(async () => {
  jest.clearAllMocks();
});

afterAll(() => {
  app.close();
});

describe('/list', () => {
  afterEach(async () => {
    await Promise.all([
      await Channel.deleteMany({}),
      await ChannelUser.deleteMany({}),
      await ChannelBlockUser.deleteMany({}),
    ]);
  });

  it('チャンネルリストを取得する', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const [testChannel1, testChannel2] = await Promise.all([
      Channel.create({
        channelName: 'testChannel1',
        channelDescription: 'testDescription',
        channelAdmin: testUserId,
      }),
      Channel.create({
        channelName: 'testChannel2',
        channelDescription: 'testDescription',
        channelAdmin: testUserId,
      }),
    ]);

    const testChannel1Id = testChannel1._id.toString();
    const testChannel2Id = testChannel2._id.toString();

    await Promise.all([
      ChannelUser.create({ channelId: testChannel1Id, userId: testUserId }),
      ChannelBlockUser.create({
        channelId: testChannel2Id,
        userId: testUserId,
      }),
    ]);

    const response = await request(app)
      .get('/api/channel/list')
      .send()
      .set('authorization', `Bearer mockToken`)
      .expect(200);

    expect(response.body).toHaveProperty('channelList');
    expect(response.body.joinedChannels).toEqual([testChannel1Id]);
    expect(response.body.blockedChannels).toEqual([testChannel2Id]);
  });

  it('チャンネルが存在しないときエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .get('/api/channel/list')
      .send()
      .set('authorization', `Bearer mockToken`)
      .expect(404);

    expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
  });

  it('ユーザーが未登録のときエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: mockUserId });

    const response = await request(app)
      .get('/api/channel/list')
      .send()
      .set('authorization', `Bearer mockToken`)
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
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const requestBody = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      passwordEnabled: false,
      password: undefined,
      denyGuests: false,
    };

    const response = await request(app)
      .post('/api/channel/create')
      .send(requestBody)
      .set('authorization', `Bearer mockToken`)
      .expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body.channelName).toBe(requestBody.channelName);
    expect(response.body.channelDescription).toBe(
      requestBody.channelDescription,
    );

    const createdChannelId = response.body._id;

    const createdChannel = await Channel.findById(createdChannelId);
    expect(createdChannel).not.toBeNull();
    expect(createdChannel?.passwordEnabled).toBe(false);
    expect(createdChannel?.password).toBeUndefined();

    const channelUserEntry = await ChannelUser.findOne({
      channelId: createdChannelId,
      userId: testUserId,
    });
    expect(channelUserEntry).not.toBeNull();
  });

  it('パスワード設定できる', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const requestBody = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      passwordEnabled: true,
      password: '12345678',
      denyGuests: false,
    };

    const response = await request(app)
      .post('/api/channel/create')
      .send(requestBody)
      .set('authorization', `Bearer mockToken`)
      .expect(201);
    const createdChannelId = response.body._id;

    const createdChannel = await Channel.findById(createdChannelId);
    expect(createdChannel).not.toBeNull();
    expect(createdChannel?.passwordEnabled).toBe(true);
    expect(createdChannel?.password).not.toBeNull();
  });

  it('パスワード設定を無効にしていればパスワードを送信しても設定されない', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const requestBody = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      passwordEnabled: false,
      password: '12345678',
      denyGuests: false,
    };

    const response = await request(app)
      .post('/api/channel/create')
      .send(requestBody)
      .set('authorization', `Bearer mockToken`)
      .expect(201);
    const createdChannelId = response.body._id;

    const createdChannel = await Channel.findById(createdChannelId);
    expect(createdChannel).not.toBeNull();
    expect(createdChannel?.passwordEnabled).toBe(false);
    expect(createdChannel?.password).toBeUndefined();
  });

  it('ゲストユーザーがチャンネルを作成しようとするとエラーになる', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

    const requestBody = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      passwordEnabled: false,
      password: undefined,
      denyGuests: false,
    };

    const response = await request(app)
      .post('/api/channel/create')
      .send(requestBody)
      .set('authorization', `Bearer mockToken`)
      .expect(403);

    expect(response.body).toHaveProperty(
      'message',
      errors.GUEST_CREATE_CHANNEL_DENIED,
    );
  });

  it('ユーザーが未登録のときエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: mockUserId });

    const requestBody = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      passwordEnabled: false,
      password: undefined,
      denyGuests: false,
    };

    const response = await request(app)
      .post('/api/channel/create')
      .send(requestBody)
      .set('authorization', `Bearer mockToken`)
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
        password: undefined,
        denyGuests: false,
      },
      validation.CHANNEL_NAME_LENGTH,
    ],
    [
      'チャンネル名が長すぎる',
      {
        channelName: 'a'.repeat(21),
        channelDescription: 'testDescription',
        passwordEnabled: false,
        password: undefined,
        denyGuests: false,
      },
      validation.CHANNEL_NAME_LENGTH,
    ],
    [
      'チャンネル名がundefined',
      {
        channelName: undefined,
        channelDescription: 'testDescription',
        passwordEnabled: false,
        password: undefined,
        denyGuests: false,
      },
      'Invalid value',
    ],
    [
      '説明文が空',
      {
        channelName: 'testChannel',
        channelDescription: '',
        passwordEnabled: false,
        password: undefined,
        denyGuests: false,
      },
      validation.CHANNEL_DESCRIPTION_LENGTH,
    ],
    [
      '説明文が長すぎる',
      {
        channelName: 'testChannel',
        channelDescription: 'a'.repeat(2001),
        passwordEnabled: false,
        password: undefined,
        denyGuests: false,
      },
      validation.CHANNEL_DESCRIPTION_LENGTH,
    ],
    [
      '説明文がundefined',
      {
        channelName: 'testChannel',
        channelDescription: undefined,
        passwordEnabled: false,
        password: undefined,
        denyGuests: false,
      },
      'Invalid value',
    ],
    [
      'パスワード有効化がundefined',
      {
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        passwordEnabled: undefined,
        password: '12345678',
        denyGuests: false,
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
      },
      validation.PASSWORD_LENGTH,
    ],
    [
      'パスワードがundefined',
      {
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        passwordEnabled: true,
        password: undefined,
        denyGuests: false,
      },
      validation.PASSWORD_LENGTH,
    ],
  ])('%s', async (_, requestBody, errorMessage) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .post('/api/channel/create')
      .send(requestBody)
      .set('authorization', `Bearer mockToken`)
      .expect(400);

    expect(response.body).toHaveProperty('message', errorMessage);
  });
});

describe('/settings, /join, /left', () => {
  let testChannelId: string;
  let passwordChannelId: string;
  let denyGuestsChannelId: string;

  beforeEach(async () => {
    const [testChannel, passwordChannel, denyGuestsChannel] = await Promise.all(
      [
        Channel.create({
          channelName: 'testChannel',
          channelDescription: 'testDescription',
          channelAdmin: testUserId,
        }),
        Channel.create({
          channelName: 'passwordChannel',
          channelDescription: 'testDescription',
          password: 'testPassword',
          passwordEnabled: true,
          channelAdmin: testUserId,
        }),
        Channel.create({
          channelName: 'denyGuestsChannel',
          channelDescription: 'testDescription',
          channelAdmin: testUserId,
          denyGuests: true,
        }),
      ],
    );

    testChannelId = testChannel._id.toString();
    passwordChannelId = passwordChannel._id.toString();
    denyGuestsChannelId = denyGuestsChannel._id.toString();
  });

  afterEach(async () => {
    await Promise.all([await Channel.deleteMany({})]);
  });

  describe('/settings', () => {
    it('チャンネル名を変更', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        channelName: 'channgedChannel',
        passwordEnabled: false,
      };

      await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(testChannelId);

      expect(testChannel?.channelName).toBe(requestBody.channelName);
    });

    it('説明文を変更', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        channelDescription: 'channgeDescription',
        passwordEnabled: false,
      };

      await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(testChannelId);

      expect(testChannel?.channelDescription).toBe(
        requestBody.channelDescription,
      );
    });

    it('パスワードを設定', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        password: 'testPassword',
        passwordEnabled: true,
      };

      await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(testChannelId);

      expect(testChannel?.password).toMatch(/^\$2[abxy]\$.{56}$/);
      expect(testChannel?.passwordEnabled).toBe(true);
    });

    it('パスワードを変更する', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        password: 'changedPassword',
        passwordEnabled: true,
      };

      const passwordChannel = await Channel.findById(passwordChannelId);
      const passwordBeforeChange = passwordChannel?.password;

      await request(app)
        .put(`/api/channel/settings/${passwordChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(passwordChannelId);

      expect(testChannel?.password).toMatch(/^\$2[abxy]\$.{56}$/);
      expect(testChannel?.password).not.toBe(passwordBeforeChange);
      expect(testChannel?.passwordEnabled).toBe(true);
    });

    it('パスワードを送信しなければパスワードが変更されない', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        passwordEnabled: true,
      };

      const passwordChannel = await Channel.findById(passwordChannelId);
      const passwordBeforeChange = passwordChannel?.password;

      await request(app)
        .put(`/api/channel/settings/${passwordChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(passwordChannelId);

      expect(testChannel?.password).toBe(passwordBeforeChange);
      expect(testChannel?.passwordEnabled).toBe(true);
    });

    it('パスワードを有効化しなければパスワードを送信しても設定されない', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        password: 'testPassword',
        passwordEnabled: false,
      };

      await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(testChannelId);

      expect(testChannel?.password).toBeUndefined();
      expect(testChannel?.passwordEnabled).toBe(false);
    });

    it('パスワードを送信しなければパスワードが有効化されない', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        passwordEnabled: true,
      };

      await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(testChannelId);

      expect(testChannel?.password).toBeUndefined();
      expect(testChannel?.passwordEnabled).toBe(false);
    });

    it('パスワードを削除', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        passwordEnabled: false,
      };

      await request(app)
        .put(`/api/channel/settings/${passwordChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const passwordChannel = await Channel.findById(passwordChannelId);

      expect(passwordChannel?.password).toBeUndefined();
      expect(passwordChannel?.passwordEnabled).toBe(false);
    });

    it('パスワードを無効化すればパスワードを送信しても設定されない', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        password: 'testPassword',
        passwordEnabled: false,
      };

      await request(app)
        .put(`/api/channel/settings/${passwordChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const passwordChannel = await Channel.findById(passwordChannelId);

      expect(passwordChannel?.password).toBeUndefined();
      expect(passwordChannel?.passwordEnabled).toBe(false);
    });

    it('ゲスト許可を変更', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        passwordEnabled: false,
        denyGuests: true,
      };

      await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const testChannel = await Channel.findById(testChannelId);

      expect(testChannel?.denyGuests).toBe(true);
    });

    it('管理者でないときエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const requestBody = {
        channelName: 'channgedChannel',
        passwordEnabled: false,
      };

      const response = await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(403);

      expect(response.body).toHaveProperty('message', errors.PERMISSION_DENIED);
    });

    it('チャンネルが見つからない時エラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        channelName: 'channgedChannel',
        passwordEnabled: false,
      };

      const response = await request(app)
        .put(`/api/channel/settings/${mockChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(404);

      expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
    });

    it('ユーザーが見つからない時エラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: mockUserId });

      const requestBody = {
        channelName: 'channgedChannel',
        passwordEnabled: false,
      };

      const response = await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(401);

      expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
    });

    it('チャンネルIDがmongoIdでないとエラーになる', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const requestBody = {
        channelName: 'channgedChannel',
        passwordEnabled: false,
      };

      const response = await request(app)
        .put('/api/channel/settings/wrongId')
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(400);

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
          passwordEnabled: false,
        },
        validation.CHANNEL_NAME_LENGTH,
      ],
      [
        'チャンネル名が長すぎる',
        {
          channelName: 'a'.repeat(21),
          passwordEnabled: false,
        },
        validation.CHANNEL_NAME_LENGTH,
      ],
      [
        '説明文が空',
        {
          channelDescription: '',
          passwordEnabled: false,
        },
        validation.CHANNEL_DESCRIPTION_LENGTH,
      ],
      [
        '説明文が長すぎる',
        {
          channelDescription: 'a'.repeat(2001),
          passwordEnabled: false,
        },
        validation.CHANNEL_DESCRIPTION_LENGTH,
      ],
      [
        'パスワードが短すぎる',
        {
          passwordEnabled: true,
          password: '1234567',
        },
        validation.PASSWORD_LENGTH,
      ],
      [
        'パスワードが長すぎる',
        {
          passwordEnabled: true,
          password: 'a'.repeat(65),
        },
        validation.PASSWORD_LENGTH,
      ],
    ])('%s', async (_, requestBody, errorMessage) => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const response = await request(app)
        .put(`/api/channel/settings/${testChannelId}`)
        .send(requestBody)
        .set('authorization', `Bearer mockToken`)
        .expect(400);

      expect(response.body).toHaveProperty('message', errorMessage);
    });
  });

  /**
   * チャンネルに参加
   * パスワード認証に成功する
   * ブロックされているとき
   * ユーザーが見つからないとき
   * チャンネルが見つからないとき
   * 既に参加しているとき
   * ゲスト禁止のチャンネルにゲストアカウントで入室しようとしたときエラーを返す
   * パスワードを間違えるとエラーを返す
   */
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
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .put(`/api/channel/join/${testChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      expect(response.body.channelName).toBe('testChannel');
      expect(response.body.channelDescription).toBe('testDescription');
      expect(response.body.channelAdmin).toBe(testUserId);
      expect(response.body.users).toEqual([
        { _id: testUserId, userName: 'testUser', pic: null },
        { _id: guestUserId, userName: 'guestUser', pic: null },
      ]);
    });

    it('パスワード認証に成功する', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .put(`/api/channel/join/${passwordChannelId}`)
        .send({ password: 'testPassword' })
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      expect(response.body.channelName).toBe('passwordChannel');
      expect(response.body.channelDescription).toBe('testDescription');
      expect(response.body.channelAdmin).toBe(testUserId);
      expect(response.body.users).toEqual([
        { _id: guestUserId, userName: 'guestUser', pic: null },
      ]);
    });

    it('ブロックされているときエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: blockedUserId });

      const response = await request(app)
        .put(`/api/channel/join/${testChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(403);

      expect(response.body).toHaveProperty('message', errors.USER_BLOCKED);
    });

    it('ユーザーが未登録のときエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: mockUserId });

      const response = await request(app)
        .put(`/api/channel/join/${testChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(401);

      expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
    });

    it('チャンネルが見つからないときエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const response = await request(app)
        .put(`/api/channel/join/${mockChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(404);

      expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
    });

    it('チャンネルに既に参加中の時', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const response = await request(app)
        .put(`/api/channel/join/${testChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      expect(response.body.channelName).toBe('testChannel');
      expect(response.body.channelDescription).toBe('testDescription');
      expect(response.body.channelAdmin).toBe(testUserId);
      expect(response.body.users).toEqual([
        { _id: testUserId, userName: 'testUser', pic: null },
      ]);
    });

    it('ゲスト禁止のチャンネルにゲストアカウントで参加しようとしたときエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .put(`/api/channel/join/${denyGuestsChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(403);

      expect(response.body).toHaveProperty(
        'message',
        errors.GUEST_ENTRY_DENIED,
      );
    });

    it('パスワードを間違えるとエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .put(`/api/channel/join/${passwordChannelId}`)
        .send({ password: 'wrongPassword' })
        .set('authorization', `Bearer mockToken`)
        .expect(401);

      expect(response.body).toHaveProperty('message', errors.WRONG_PASSWORD);
    });

    it('パスワードを送信しないとエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .put(`/api/channel/join/${passwordChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(401);

      expect(response.body).toHaveProperty('message', errors.WRONG_PASSWORD);
    });

    it('チャンネルIDがmongoIdでないとエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .put('/api/channel/join/wrongId')
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(400);

      expect(response.body).toHaveProperty(
        'message',
        validation.INVALID_CHANNEL_ID,
      );
    });

    test.each([
      ['パスワードが短すぎる', { password: '1234567' }],
      ['パスワードが長すぎる', { password: 'a'.repeat(65) }],
    ])('%s', async (_, password) => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .put(`/api/channel/join/${passwordChannelId}`)
        .send(password)
        .set('authorization', `Bearer mockToken`)
        .expect(400);

      expect(response.body).toHaveProperty(
        'message',
        validation.PASSWORD_LENGTH,
      );
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
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      await request(app)
        .delete(`/api/channel/leave/${testChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(200);

      const leftUser = await ChannelUser.findOne({
        channelId: testChannelId,
        userId: guestUserId,
      });

      expect(leftUser).toBeNull();
    });

    it('管理者は退出できない', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

      const response = await request(app)
        .delete(`/api/channel/leave/${testChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(403);

      expect(response.body).toHaveProperty(
        'message',
        errors.ADMIN_LEAVE_DENIED,
      );
    });

    it('ユーザーが未登録のとき', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: mockUserId });

      const response = await request(app)
        .delete(`/api/channel/leave/${testChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(401);

      expect(response.body).toHaveProperty('message', errors.USER_NOT_FOUND);
    });

    it('ユーザーが既に退出済みのとき', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .delete(`/api/channel/leave/${passwordChannelId}`)
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(400);

      expect(response.body).toHaveProperty('message', errors.USER_ALREADY_LEFT);
    });

    it('チャンネルIDがmongoIdでないとエラーを返す', async () => {
      (decodeToken as jest.Mock).mockReturnValue({ userId: guestUserId });

      const response = await request(app)
        .delete('/api/channel/leave/wrongId')
        .send()
        .set('authorization', `Bearer mockToken`)
        .expect(400);

      expect(response.body).toHaveProperty(
        'message',
        validation.INVALID_CHANNEL_ID,
      );
    });
  });
});
