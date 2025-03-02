jest.mock('../../src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));

import app from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/userModel';
import { errors, validation } from '../../src/config/messages';
import { mockUserId } from '../../jest.setup';

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

describe('updateEmail', () => {
  let testUserId: string;

  beforeEach(async () => {
    const testUser = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    testUserId = testUser._id.toString();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  const customRequest = async (
    userId: string,
    email: string,
    action: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId, email, action });

    const response = await request(app)
      .get('/api/user/email/mockToken')
      .send()
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('メールアドレスの変更に成功する', async () => {
    await customRequest(testUserId, 'changed@example.com', 'changeEmail', 200);

    const user = await User.findById(testUserId).select('email').lean();

    expect(user?.email).toBe('changed@example.com');
  });

  it('トークン内のactionが不正な時、401エラーを返す', async () => {
    await customRequest(
      testUserId,
      'changed@example.com',
      'invalidAction',
      401,
      errors.INVALID_TOKEN,
    );
  });

  it('メールアドレスが既に登録されているとき、400エラーを返す', async () => {
    await customRequest(
      testUserId,
      'already-registered@example.com',
      'changeEmail',
      400,
      errors.EMAIL_ALREADY_REGISTERED,
    );
  });

  it('ユーザーが見つからない時、401エラーを返す', async () => {
    await customRequest(
      mockUserId,
      'changed@example.com',
      'changeEmail',
      401,
      errors.USER_NOT_FOUND,
    );
  });

  it('メールアドレスの形式が不正な時', async () => {
    await customRequest(testUserId, 'invalidEmail', 'changeEmail', 500);
  });
});

describe('changePassword', () => {
  let testUserId: string;

  beforeEach(async () => {
    const testUser = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password',
      pic: null,
      isGuest: false,
    });
    testUserId = testUser._id.toString();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  const customRequest = async (
    userId: string,
    currentPassword: string | undefined,
    newPassword: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .put('/api/user/password')
      .send({ currentPassword, newPassword })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('パスワードの変更に成功する', async () => {
    await customRequest(testUserId, 'password', 'newPassword', 200);
  });

  it('ユーザーが存在しないとき', async () => {
    await customRequest(
      mockUserId,
      'password',
      'newPassword',
      401,
      errors.USER_NOT_FOUND,
    );
  });

  it('現在のパスワードが間違っているとき', async () => {
    await customRequest(
      testUserId,
      'wrongPassword',
      'newPassword',
      401,
      errors.WRONG_PASSWORD,
    );
  });

  it('現在のパスワードがundefinedのとき', async () => {
    await customRequest(
      testUserId,
      undefined,
      'newPassword',
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('現在のパスワードが短すぎるとき', async () => {
    await customRequest(
      testUserId,
      undefined,
      'a'.repeat(7),
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('現在のパスワードが長すぎるとき', async () => {
    await customRequest(
      testUserId,
      undefined,
      'a'.repeat(65),
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('変更後のパスワードがundefinedのとき', async () => {
    await customRequest(
      testUserId,
      'password',
      undefined,
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('変更後のパスワードが短すぎるとき', async () => {
    await customRequest(
      testUserId,
      'password',
      'a'.repeat(7),
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('変更後のパスワードが長すぎるとき', async () => {
    await customRequest(
      testUserId,
      'password',
      'a'.repeat(65),
      400,
      validation.PASSWORD_LENGTH,
    );
  });
});

describe('resetPassword', () => {
  let testUserId: string;

  beforeEach(async () => {
    const testUser = await User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    testUserId = testUser._id.toString();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  const customRequest = async (
    email: string,
    action: string,
    password: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ email, action });

    const response = await request(app)
      .put('/api/user/reset-password')
      .send({ password })
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('パスワードのリセットに成功する', async () => {
    await customRequest(
      'already-registered@example.com',
      'forgotPassword',
      'newPassword',
      200,
    );
  });

  it('トークン内のactionが不正な時、401エラーを返す', async () => {
    await customRequest(
      'already-registered@example.com',
      ' ',
      'newPassword',
      401,
      errors.INVALID_TOKEN,
    );
  });

  it('ユーザーが存在しない時、401エラーを返す', async () => {
    await customRequest(
      'not-registered@example.com',
      'forgotPassword',
      'newPassword',
      401,
      errors.USER_NOT_FOUND,
    );
  });

  it('パスワードがundefinedのとき', async () => {
    await customRequest(
      'already-registered@example.com',
      'forgotPassword',
      undefined,
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('パスワードが短すぎるとき', async () => {
    await customRequest(
      'already-registered@example.com',
      'forgotPassword',
      'a'.repeat(7),
      400,
      validation.PASSWORD_LENGTH,
    );
  });

  it('パスワードが長すぎるとき', async () => {
    await customRequest(
      'already-registered@example.com',
      'forgotPassword',
      'a'.repeat(65),
      400,
      validation.PASSWORD_LENGTH,
    );
  });
});
