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

beforeAll(async () => {
  const [testUser, guestUser] = await Promise.all([
    User.create({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    }),
    User.create({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'password123',
      pic: null,
      isGuest: true,
    }),
  ]);

  testUserId = testUser._id.toString();
  guestUserId = guestUser._id.toString();
});

beforeEach(async () => {
  jest.clearAllMocks();
});

afterEach(() => {
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

/**
 * 各設定の変更
 * 管理者でないとき
 * チャンネルが見つからないとき
 * ユーザーが見つからない時
 */
describe('/settings, /join, /left', () => {
  let testChannelId: string;
  let passwordChannelId: string;

  beforeEach(async () => {
    const [testChannel, passwordChannel] = await Promise.all([
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
    ]);

    testChannelId = testChannel._id.toString();
    passwordChannelId = passwordChannel._id.toString();
  });

  afterEach(async () => {
    await Promise.all([
      await Channel.deleteMany({}),
      await ChannelUser.deleteMany({}),
      await ChannelBlockUser.deleteMany({}),
    ]);
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
});
