jest.mock('../../src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));

import app from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/userModel';
import { errors, validation } from '../../src/config/messages';

describe('/register', () => {
  beforeEach(async () => {
    await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  const customRequest = async (
    email: string,
    action: string,
    userName: string | undefined,
    password: string | undefined,
    token: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ email, action });

    const response = await request(app)
      .post('/api/user/register')
      .send({ userName, password, token })
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('ユーザー登録に成功する', async () => {
    await customRequest(
      'test@example.com',
      'registerUser',
      'testUser',
      'password',
      'mockToken',
      201,
    );
  });

  it('トークンのactionが不正な時、401エラーを返す', async () => {
    await customRequest(
      'test@example.com',
      'invalidAction',
      'testUser',
      'password',
      'mockToken',
      401,
      errors.INVALID_TOKEN,
    );
  });

  it('メールアドレスが既に登録されている時、400エラーを返す', async () => {
    await customRequest(
      'already-registered@example.com',
      'registerUser',
      'testUser',
      'password',
      'mockToken',
      400,
      errors.EMAIL_ALREADY_REGISTERED,
    );
  });

  it('ユーザー名がundefinedのとき', async () => {
    await customRequest(
      'test@example.com',
      'registerUser',
      undefined,
      'password',
      'mockToken',
      400,
      validation.USER_NAME_LENGTH,
    );
  });

  it('ユーザー名が空文字のとき', async () => {
    await customRequest(
      'test@example.com',
      'registerUser',
      '',
      'password',
      'mockToken',
      400,
      validation.USER_NAME_LENGTH,
    );
  });

  it('ユーザー名が長すぎるとき', async () => {
    await customRequest(
      'test@example.com',
      'registerUser',
      'a'.repeat(21),
      'password',
      'mockToken',
      400,
      validation.USER_NAME_LENGTH,
    );
  });

  it('パスワードがundefinedのとき', async () => {
    await customRequest(
      'test@example.com',
      'registerUser',
      'testUser',
      undefined,
      'mockToken',
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('パスワードが短すぎるとき', async () => {
    await customRequest(
      'test@example.com',
      'registerUser',
      'testUser',
      'a'.repeat(7),
      'mockToken',
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('パスワードが長すぎるとき', async () => {
    await customRequest(
      'test@example.com',
      'registerUser',
      'testUser',
      'a'.repeat(65),
      'mockToken',
      400,
      validation.PASSWORD_LENGTH,
    );
  });
});

describe('/login', () => {
  let testUserId: string;

  beforeAll(async () => {
    const testUser = await User.create({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'password',
      pic: null,
      isGuest: false,
    });

    testUserId = testUser._id.toString();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const customRequest = async (
    email: string | undefined,
    password: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    const response = await request(app)
      .post('/api/user/login')
      .send({ email, password })
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('ログイン成功', async () => {
    const loginUser = await customRequest('test@example.com', 'password', 200);

    expect(loginUser.userId).toBe(testUserId);
    expect(loginUser.userName).toBe('testUser');
    expect(loginUser.pic).toBe(null);
  });

  it('メールアドレスが登録されていないとき', async () => {
    await customRequest(
      'not-registered@example.com',
      'password',
      400,
      errors.EMAIL_NOT_FOUND,
    );
  });

  it('パスワードが間違っているとき', async () => {
    await customRequest(
      'test@example.com',
      'wrongpassword',
      401,
      errors.WRONG_PASSWORD,
    );
  });

  it('メールアドレスがundefinedのとき', async () => {
    await customRequest(undefined, 'password', 400, validation.INVALID_EMAIL);
  });

  it('メールアドレスの形式が正しくないとき', async () => {
    await customRequest(
      'wrongEmail',
      'password',
      400,
      validation.INVALID_EMAIL,
    );
  });

  it('パスワードがundefinedのとき', async () => {
    await customRequest(
      'test@example.com',
      undefined,
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('パスワードが短すぎるとき', async () => {
    await customRequest(
      'test@example.com',
      'a'.repeat(7),
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('パスワードが長すぎるとき', async () => {
    await customRequest(
      'test@example.com',
      'a'.repeat(65),
      400,
      validation.PASSWORD_LENGTH,
    );
  });
});

describe('updateProfile', () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });

    testUserId = user._id.toString();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  const customRequest = async (
    userId: string,
    userName: string | undefined,
    pic: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .put('/api/user/profile')
      .send({ userName, pic })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('ユーザー名の更新に成功する', async () => {
    await customRequest(testUserId, 'newUserName', undefined, 200);
  });

  it('ユーザー名と画像が送信されなかったとき', async () => {
    await customRequest(
      testUserId,
      undefined,
      undefined,
      400,
      errors.NO_UPDATE_DATA,
    );
  });

  it('画像の形式が正しくないとき', async () => {
    await customRequest(
      testUserId,
      undefined,
      'invalidPicture',
      400,
      validation.INVALID_PIC,
    );
  });

  it('ユーザー名が空文字のとき', async () => {
    await customRequest(
      testUserId,
      '',
      undefined,
      400,
      validation.USER_NAME_LENGTH,
    );
  });

  it('ユーザー名が長すぎるとき', async () => {
    await customRequest(
      testUserId,
      'a'.repeat(21),
      undefined,
      400,
      validation.USER_NAME_LENGTH,
    );
  });
});

/* describe('updateEmail', () => {
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
}); */
