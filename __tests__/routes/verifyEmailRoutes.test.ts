jest.mock('../../src/controllers/verifyEmailController/utils', () => ({
  ...jest.requireActual('../../src/controllers/verifyEmailController/utils'),
  sendMail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));

import app from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/userModel';
import { errors, validation } from '../../src/config/messages';

let testUserId: string;
let guestUserId: string;

beforeEach(async () => {
  const [testUser, guestUser] = await Promise.all([
    User.create({
      userName: 'testUser',
      email: 'already-registered@example.com',
      password: 'password',
      pic: null,
      isGuest: false,
    }),
    User.create({}),
  ]);

  testUserId = testUser._id.toString();
  guestUserId = guestUser._id.toString();
});

afterEach(async () => {
  jest.clearAllMocks();
  await User.deleteMany({});
});

describe('/register-user', () => {
  const customRequest = async (
    email: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    const response = await request(app)
      .post('/api/verify-email/register-user')
      .send({ email })
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('登録用メールが送信できる', async () => {
    await customRequest('test@example.com', 202);
  });

  it('既に登録されたメールアドレスを送信したとき', async () => {
    await customRequest(
      'already-registered@example.com',
      400,
      errors.EMAIL_ALREADY_REGISTERED,
    );
  });

  it('メールアドレスがundefinedのとき', async () => {
    await customRequest(undefined, 400, validation.INVALID_EMAIL);
  });

  it('メールアドレスの形式が正しくないとき', async () => {
    await customRequest('invalidEmail', 400, validation.INVALID_EMAIL);
  });
});

describe('/change-email', () => {
  const customRequest = async (
    userId: string,
    email: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .post('/api/verify-email/change-email')
      .send({ email })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('メールアドレス変更用メールが送信できる', async () => {
    await customRequest(testUserId, 'change@example.com', 202);
  });

  it('既に登録されたメールアドレスを送信したとき', async () => {
    await customRequest(
      testUserId,
      'already-registered@example.com',
      400,
      errors.EMAIL_ALREADY_REGISTERED,
    );
  });

  it('ゲストアカウントでメールアドレスを変更しようとしているとき', async () => {
    await customRequest(
      guestUserId,
      'change@example.com',
      403,
      errors.PERMISSION_DENIED,
    );
  });

  it('メールアドレスがundefinedのとき', async () => {
    await customRequest(testUserId, undefined, 400, validation.INVALID_EMAIL);
  });

  it('メールアドレスの形式が正しくないとき', async () => {
    await customRequest(
      testUserId,
      'invalidEmail',
      400,
      validation.INVALID_EMAIL,
    );
  });
});

describe('/forgot-password', () => {
  const customRequest = async (
    email: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    const response = await request(app)
      .post('/api/verify-email/forgot-password')
      .send({ email })
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('パスワードリセット用メールが送信できる', async () => {
    await customRequest('already-registered@example.com', 202);
  });

  it('メールアドレスがundefinedのとき', async () => {
    await customRequest(undefined, 400, validation.INVALID_EMAIL);
  });

  it('メールアドレスの形式が正しくないとき', async () => {
    await customRequest('invalidEmail', 400, validation.INVALID_EMAIL);
  });

  it('メールアドレスが登録されていないとき', async () => {
    await customRequest(
      'not-registered@example.com',
      400,
      errors.EMAIL_NOT_REGISTERED,
    );
  });
});
