jest.mock('../../src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));
import { decodeToken } from '../../src/utils/decodeToken';

import express from 'express';
import request from 'supertest';
import userRoutes from '../../src/routes/userRoutes';
import User from '../../src/models/userModel';

const app = express();
app.use(express.json());
app.use(userRoutes);

describe('registerUser', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});

    await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
  });

  it('ユーザー登録に成功する', async () => {
    const decodedToken = { email: 'test@example.com', action: 'registerUser' };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);
    const response = await request(app).post('/register').send({
      userName: 'testUser',
      password: 'password123',
      token: 'mockToken',
    });

    expect(response.status).toBe(201);
  });

  it('ユーザー名が提供されていない時、バリデーションエラーを返す', async () => {
    const decodedToken = { email: 'test@example.com', action: 'registerUser' };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);
    const response = await request(app).post('/register').send({
      password: 'password123',
      token: 'mockToken',
    });

    expect(response.status).toBe(400);
  });

  it('ユーザー名が長すぎる時、バリデーションエラーを返す', async () => {
    const decodedToken = { email: 'test@example.com', action: 'registerUser' };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);
    const response = await request(app).post('/register').send({
      userName: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほ',
      password: 'password123',
      token: 'mockToken',
    });

    expect(response.status).toBe(400);
  });

  it('パスワードが提供されていない時、バリデーションエラーを返す', async () => {
    const decodedToken = { email: 'test@example.com', action: 'registerUser' };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);
    const response = await request(app).post('/register').send({
      userName: 'testUser',
      token: 'mockToken',
    });

    expect(response.status).toBe(400);
  });

  it('パスワードが短すぎる時、バリデーションエラーを返す', async () => {
    const decodedToken = { email: 'test@example.com', action: 'registerUser' };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);
    const response = await request(app).post('/register').send({
      userName: 'testUser',
      password: 'short',
      token: 'mockToken',
    });

    expect(response.status).toBe(400);
  });

  it('トークン内のactionが不正な時、401エラーを返す', async () => {
    const decodedToken = { email: 'test@example.com', action: 'invalidAction' };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);
    const response = await request(app).post('/register').send({
      userName: 'testUser',
      password: 'password123',
      token: 'mockToken',
    });

    expect(response.status).toBe(401);
  });

  it('メールアドレスが既に登録されている時、400エラーを返す', async () => {
    const decodedToken = {
      email: 'already-registered@example.com',
      action: 'registerUser',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);
    const response = await request(app).post('/register').send({
      userName: 'testUser',
      password: 'password123',
      token: 'mockToken',
    });

    expect(response.status).toBe(400);
  });
});

describe('login', () => {
  beforeAll(async () => {
    await User.create({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログイン成功', async () => {
    const response = await request(app).post('/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
  });

  it('メールアドレスが登録されていない時、400エラーを返す', async () => {
    const response = await request(app).post('/login').send({
      email: 'not-registered@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(400);
  });

  it('パスワードが間違っている時、401エラーを返す', async () => {
    const response = await request(app).post('/login').send({
      email: 'test@example.com',
      password: 'wrongPassword',
    });

    expect(response.status).toBe(401);
  });
});

describe('updateProfile', () => {
  let userId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    const user = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    userId = user._id.toString();
  });

  it('ユーザー名の更新に成功する', async () => {
    const decodedToken = { userId };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app)
      .put('/profile')
      .send({
        userName: 'newUserName',
      })
      .set('authorization', 'Bearer mockToken');

    expect(response.status).toBe(200);
  });

  it('ユーザー名と画像が送信されなかった場合、400エラーを返す', async () => {
    const decodedToken = { userId };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app)
      .put('/profile')
      .send({})
      .set('authorization', 'Bearer mockToken');

    expect(response.status).toBe(400);
  });

  it('画像の形式が無効な場合、400エラーを返す', async () => {
    const decodedToken = { userId };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app)
      .put('/profile')
      .send({
        pic: 'invalidPicture',
      })
      .set('authorization', 'Bearer mockToken');

    expect(response.status).toBe(400);
  });
});

describe('updateEmail', () => {
  let userId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    const user = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    userId = user._id.toString();
  });

  it('メールアドレスの変更が成功する', async () => {
    const decodedToken = {
      userId,
      email: 'test@example.com',
      action: 'changeEmail',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app).get('/email/mockToken').send();

    expect(response.status).toBe(200);
  });

  it('トークン内のactionが不正な時、401エラーを返す', async () => {
    const decodedToken = {
      userId,
      email: 'test@example.com',
      action: '不正なaction',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app).get('/email/mockToken').send();

    expect(response.status).toBe(401);
  });

  it('メールアドレスが既に登録されているとき、400エラーを返す', async () => {
    const decodedToken = {
      userId,
      email: 'already-registered@example.com',
      action: 'changeEmail',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app).get('/email/mockToken').send();

    expect(response.status).toBe(400);
  });

  it('ユーザーが見つからない時、401エラーを返す', async () => {
    const decodedToken = {
      userId: '6778c844e067470371b2ff36', // 存在しないid
      email: 'test@example.com',
      action: 'changeEmail',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app).get('/email/mockToken').send();

    expect(response.status).toBe(401);
  });
});

describe('changePassword', () => {
  let userId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    const user = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    userId = user._id.toString();
  });

  it('パスワードの変更に成功する', async () => {
    const decodedToken = { userId };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app)
      .put('/password')
      .send({
        currentPassword: 'password123',
        newPassword: 'newPassword',
      })
      .set('authorization', 'Bearer mockToken');

    expect(response.status).toBe(200);
  });

  it('ユーザーが存在しない時、401エラーを返す', async () => {
    const decodedToken = { userId: '6778c844e067470371b2ff36' }; // 存在しないid
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app)
      .put('/password')
      .send({
        currentPassword: 'password123',
        newPassword: 'newPassword',
      })
      .set('authorization', 'Bearer mockToken');

    expect(response.status).toBe(401);
  });

  it('パスワードが間違っている時、401エラーを返す', async () => {
    const decodedToken = { userId };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app)
      .put('/password')
      .send({
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
      })
      .set('authorization', 'Bearer mockToken');

    expect(response.status).toBe(401);
  });
});

describe('resetPassword', () => {
  let userId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    const user = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    userId = user._id.toString();
  });

  it('パスワードのリセットに成功する', async () => {
    const decodedToken = {
      email: 'already-registered@example.com',
      action: 'forgotPassword',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app).put('/reset-password').send({
      password: 'changedPassword',
      token: 'mockToken',
    });

    expect(response.status).toBe(200);
  });

  it('トークン内のactionが不正な時、401エラーを返す', async () => {
    const decodedToken = {
      email: 'already-registered@example.com',
      action: 'wrongAction',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app).put('/reset-password').send({
      password: 'changedPassword',
      token: 'mockToken',
    });

    expect(response.status).toBe(401);
  });

  it('ユーザーが存在しない時、401エラーを返す', async () => {
    const decodedToken = {
      email: 'not-registered@example.com',
      action: 'forgotPassword',
    };
    (decodeToken as jest.Mock).mockReturnValue(decodedToken);

    const response = await request(app).put('/reset-password').send({
      password: 'changedPassword',
      token: 'mockToken',
    });

    expect(response.status).toBe(401);
  });
});
