const sendMailMock = jest.fn();
jest.mock('../../src/controllers/verifyEmailController/utils', () => ({
  sendMail: sendMailMock,
}));

import app from '../../src/app';
import request from 'supertest';
import User from '../../src/models/User';
import { errors, validation } from '../../src/config/messages';
import { genUserToken } from '../../src/utils/generateToken';
import { ObjectId } from 'mongodb';

describe('test verifyEmailRoutes', () => {
  const testUserId = new ObjectId().toString();
  const guestUserId = new ObjectId().toString();

  beforeEach(async () => {
    await Promise.all([
      User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'already-registered@example.com',
        password: 'password',
      }),
      User.create({
        _id: guestUserId,
        isGuest: true,
      }),
    ]);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  afterAll(() => {
    app.close();
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
      expect(sendMailMock).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'registerUser',
      );
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

    it('メール送信に失敗したとき', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('test error'));
      await customRequest('test@example.com', 500, errors.EMAIL_SEND_FAILED);
    });
  });

  describe('/change-email', () => {
    const customRequest = async (
      userId: string,
      email: string | undefined,
      currentPassword: string | undefined,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .post('/api/verify-email/change-email')
        .send({ email, currentPassword })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response.body;
    };

    it('メールアドレス変更用メールが送信できる', async () => {
      await customRequest(testUserId, 'change@example.com', 'password', 202);
      expect(sendMailMock).toHaveBeenCalledWith(
        'change@example.com',
        expect.any(String),
        'changeEmail',
      );
    });

    it('既に登録されたメールアドレスを送信したとき', async () => {
      await customRequest(
        testUserId,
        'already-registered@example.com',
        'password',
        400,
        errors.EMAIL_ALREADY_REGISTERED,
      );
    });

    it('ゲストアカウントでメールアドレスを変更しようとしているとき', async () => {
      await customRequest(
        guestUserId,
        'change@example.com',
        'password',
        403,
        errors.PERMISSION_DENIED,
      );
    });

    it('メールアドレスがundefinedのとき', async () => {
      await customRequest(
        testUserId,
        undefined,
        'password',
        400,
        validation.INVALID_EMAIL,
      );
    });

    it('メールアドレスの形式が正しくないとき', async () => {
      await customRequest(
        testUserId,
        'invalidEmail',
        'password',
        400,
        validation.INVALID_EMAIL,
      );
    });

    it('メール送信に失敗したとき', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('test error'));
      await customRequest(
        testUserId,
        'change@example.com',
        'password',
        500,
        errors.EMAIL_SEND_FAILED,
      );
    });

    it('should throw error if currentPassword is not contained', async () => {
      await customRequest(
        testUserId,
        'change@example.com',
        undefined,
        400,
        validation.PASSWORD_LENGTH,
      );
    });

    it('should throw error if currentPassword is incorrect', async () => {
      await customRequest(
        testUserId,
        'change@example.com',
        'wrongPassword',
        401,
        errors.WRONG_PASSWORD,
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
      expect(sendMailMock).toHaveBeenCalledWith(
        'already-registered@example.com',
        expect.any(String),
        'forgotPassword',
      );
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

    it('メール送信に失敗したとき', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('test error'));
      await customRequest(
        'already-registered@example.com',
        500,
        errors.EMAIL_SEND_FAILED,
      );
    });
  });
});
