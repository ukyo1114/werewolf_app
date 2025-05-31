const mockUploadPicture = jest.fn();

jest.mock('../../src/controllers/userController/utils', () => ({
  uploadPicture: mockUploadPicture,
}));

import app from '../../src/app';
import request from 'supertest';
import User from '../../src/models/User';
import { errors, validation } from '../../src/config/messages';
import { mockUserId } from '../../__mocks__/mockdata';
import { ObjectId } from 'mongodb';
import {
  genUserToken,
  genVerificationToken,
  actionType,
} from '../../src/utils/generateToken';
import mongoose from 'mongoose';

describe('test userRoutes', () => {
  const testUserId = new ObjectId().toString();
  const guestUserId = new ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  beforeEach(async () => {
    await Promise.all([
      User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password',
        pic: null,
        isGuest: false,
      }),
      User.create({
        userName: 'testUser',
        email: 'already-registered@example.com',
        password: 'password',
        pic: null,
        isGuest: false,
      }),
      User.create({
        _id: guestUserId,
        isGuest: true,
      }),
    ]);
  });

  afterEach(async () => {
    // jest.clearAllMocks();
    await User.deleteMany({});
    mockUploadPicture.mockClear();
  });

  afterAll(() => {
    app.close();
  });

  describe('/register', () => {
    const customRequest = async (
      email: string,
      action: actionType,
      userName: string | undefined,
      password: string | undefined,
      status: number,
      errorMessage?: string,
    ) => {
      const token = genVerificationToken({
        userId: null,
        email,
        action,
      });
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
        'new@example.com',
        'registerUser',
        'testUser',
        'password',
        201,
      );
    });

    it('トークンのactionが不正な時、401エラーを返す', async () => {
      await customRequest(
        'test@example.com',
        'invalidAction' as actionType,
        'testUser',
        'password',
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
        400,
        validation.PASSWORD_LENGTH,
      );
    });
  });

  describe('/login', () => {
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
      const loginUser = await customRequest(
        'test@example.com',
        'password',
        200,
      );

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

  describe('/guest', () => {
    const customRequest = async (status: number, errorMessage?: string) => {
      const response = await request(app)
        .get('/api/user/guest')
        .send()
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response.body;
    };

    it('ゲストアカウントが作成されユーザー情報を取得', async () => {
      const guestUser = await customRequest(200);

      expect(guestUser).toHaveProperty('userId');
      expect(guestUser).toHaveProperty('token');

      const createdUser = await User.exists({ _id: guestUser.userId });

      expect(createdUser).not.toBeNull();
    });
  });

  describe('updateProfile', () => {
    const customRequest = async (
      userId: string,
      userName: string | null,
      pic: string | null,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .put('/api/user/profile')
        .send({ userName, pic })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response.body;
    };

    it('ユーザー名の更新に成功する', async () => {
      await customRequest(testUserId, 'newUserName', null, 200);
    });

    it('ゲストユーザーのユーザー名の更新に成功する', async () => {
      await customRequest(guestUserId, 'newUsername', null, 200);
    });

    it('ユーザー名と画像が送信されなかったとき', async () => {
      await customRequest(testUserId, null, null, 400, errors.NO_UPDATE_DATA);
    });

    it('画像の形式が正しくないとき', async () => {
      await customRequest(
        testUserId,
        null,
        'invalidPicture',
        400,
        validation.INVALID_PIC,
      );
    });

    it('ユーザー名が空文字のとき', async () => {
      await customRequest(
        testUserId,
        '',
        null,
        400,
        validation.USER_NAME_LENGTH,
      );
    });

    it('ユーザー名が長すぎるとき', async () => {
      await customRequest(
        testUserId,
        'a'.repeat(21),
        null,
        400,
        validation.USER_NAME_LENGTH,
      );
    });

    it('JPEG画像のアップロードに成功する', async () => {
      const validJpegBase64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQRAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AP/8A/9k=';

      await customRequest(testUserId, null, validJpegBase64, 200);
      expect(mockUploadPicture).toHaveBeenCalledWith({
        userId: testUserId,
        pic: validJpegBase64,
      });
    });

    it('1MB未満のJPEG画像のアップロードに成功する', async () => {
      const validJpegBase64 =
        'data:image/jpeg;base64,' + 'A'.repeat(1 * 1024 * 1024 - 100);

      await customRequest(testUserId, null, validJpegBase64, 200);
      expect(mockUploadPicture).toHaveBeenCalledWith({
        userId: testUserId,
        pic: validJpegBase64,
      });
    });

    it('1MBを超えるJPEG画像のアップロードに失敗する', async () => {
      // 1MBを超えるサイズのJPEG画像のBase64データを生成
      const largeJpegBase64 =
        'data:image/jpeg;base64,' + 'A'.repeat(1 * 1024 * 1024);

      await customRequest(testUserId, null, largeJpegBase64, 413);
      expect(mockUploadPicture).not.toHaveBeenCalled();
    });

    it('JPEG以外の画像形式のアップロードに失敗する', async () => {
      // PNG画像のBase64データ
      const pngBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      await customRequest(
        testUserId,
        null,
        pngBase64,
        400,
        validation.INVALID_PIC,
      );
      expect(mockUploadPicture).not.toHaveBeenCalled();
    });

    it('不正なBase64データのアップロードに失敗する', async () => {
      await customRequest(
        testUserId,
        null,
        'invalid-base64-data',
        400,
        validation.INVALID_PIC,
      );
      expect(mockUploadPicture).not.toHaveBeenCalled();
    });

    it('ユーザー名と画像の同時更新に成功する', async () => {
      const validJpegBase64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQRAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AP/8A/9k=';

      await customRequest(testUserId, 'newUserName', validJpegBase64, 200);
      expect(mockUploadPicture).toHaveBeenCalledWith({
        userId: testUserId,
        pic: validJpegBase64,
      });
    });
  });

  describe('updateEmail', () => {
    const customRequest = async (
      userId: string,
      email: string,
      action: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genVerificationToken({
        userId,
        email,
        action: action as actionType,
      });
      const response = await request(app)
        .get(`/api/user/email/${mockToken}`)
        .send({ email, action })
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response.body;
    };

    it('メールアドレスの変更に成功する', async () => {
      await customRequest(
        testUserId,
        'changed@example.com',
        'changeEmail',
        200,
      );

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
    const customRequest = async (
      userId: string,
      currentPassword: string | undefined,
      newPassword: string | undefined,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .put('/api/user/password')
        .send({ currentPassword, newPassword })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response.body;
    };

    it('パスワードの変更に成功する', async () => {
      await customRequest(testUserId, 'password', 'newPassword', 200);
    });

    it('ゲストアカウントでパスワードを変更しようとしたとき', async () => {
      await customRequest(
        guestUserId,
        'guestpassword',
        'newPassword',
        403,
        errors.PERMISSION_DENIED,
      );
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
    const customRequest = async (
      email: string,
      action: string,
      password: string | undefined,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genVerificationToken({
        userId: null,
        email,
        action: action as actionType,
      });
      const response = await request(app)
        .put('/api/user/reset-password')
        .send({ password, token: mockToken })
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response.body;
    };

    it('パスワードのリセットに成功する', async () => {
      await customRequest(
        'test@example.com',
        'forgotPassword',
        'newPassword',
        200,
      );
    });

    it('トークン内のactionが不正な時、401エラーを返す', async () => {
      await customRequest(
        'test@example.com',
        'invalidAction',
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
        'test@example.com',
        'forgotPassword',
        undefined,
        400,
        validation.PASSWORD_LENGTH,
      );
    });

    it('パスワードが短すぎるとき', async () => {
      await customRequest(
        'test@example.com',
        'forgotPassword',
        'a'.repeat(7),
        400,
        validation.PASSWORD_LENGTH,
      );
    });

    it('パスワードが長すぎるとき', async () => {
      await customRequest(
        'test@example.com',
        'forgotPassword',
        'a'.repeat(65),
        400,
        validation.PASSWORD_LENGTH,
      );
    });
  });
});
