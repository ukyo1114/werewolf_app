import mongoose from 'mongoose';
import Users from '@/models/Users';
import { errors } from '@/config/messages';

describe('UserStatics', () => {
  const userId = new mongoose.Types.ObjectId();
  const email = 'UserStatics@example.com';

  beforeEach(async () => {
    await Users.deleteOne({ _id: userId });
  });

  describe('isGuest', () => {
    it('ゲストユーザーでtrueを返す', async () => {
      const user = await Users.create({
        userName: 'GuestUser',
        isGuest: true,
      });

      const result = await Users.isGuest(user._id.toString());
      expect(result).toBe(true);
    });

    it('一般ユーザーでfalseを返す', async () => {
      const user = await Users.create({
        _id: userId,
        userName: 'RegularUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      const result = await Users.isGuest(user._id.toString());
      expect(result).toBe(false);
    });

    it('存在しないユーザーIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(Users.isGuest(nonExistentId)).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });

    it('削除されたユーザーでエラーを投げる', async () => {
      const user = await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      await user.softDelete();

      await expect(Users.isGuest(user._id.toString())).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });
  });

  describe('register', () => {
    it('新規ユーザーを登録できる', async () => {
      const userName = 'NewUser';
      const password = 'password123';

      const userId = await Users.register(userName, email, password);

      const savedUser = await Users.findById(userId);
      expect(savedUser?.userName).toBe(userName);
      expect(savedUser?.email).toBe(email);
      expect(savedUser?.isGuest).toBe(false);
      await expect(savedUser?.matchPassword(password)).resolves.toBeUndefined();

      await Users.deleteOne({ _id: userId });
    });

    it('最近削除されたメールアドレスでエラーを投げる', async () => {
      // 最近削除されたユーザーを作成
      await Users.create({
        _id: userId,
        userName: 'DeletedUser',
        email: 'deleted.UserStatics@example.com',
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(
        Users.register(
          'NewUser',
          'deleted.UserStatics@example.com',
          'password123',
        ),
      ).rejects.toThrow(errors.EMAIL_RESENTLY_DELETED);
    });

    it('メールアドレスがすでに使用されている場合エラーを投げる', async () => {
      const alreadyRegisteredUserId = new mongoose.Types.ObjectId().toString();
      await Users.create({
        _id: alreadyRegisteredUserId,
        userName: 'TestUser',
        email: 'alreadyRegistered.UserStatics@example.com',
        password: 'password123',
        isGuest: false,
      });

      await expect(
        Users.register(
          'NewUser',
          'alreadyRegistered.UserStatics@example.com',
          'password123',
        ),
      ).rejects.toThrow();

      await Users.deleteOne({ _id: alreadyRegisteredUserId });
    });
  });

  describe('login', () => {
    it('正しい認証情報でログインできる', async () => {
      const user = await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      const loggedInUser = await Users.login(email, 'password123');
      expect(loggedInUser._id.toString()).toBe(user._id.toString());
    });

    it('存在しないメールアドレスでエラーを投げる', async () => {
      await expect(
        Users.login('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });

    it('間違ったパスワードでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      await expect(Users.login(email, 'wrongpassword')).rejects.toThrow(
        errors.WRONG_PASSWORD,
      );
    });

    it('削除されたユーザーでログインできない', async () => {
      const user = await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      await user.softDelete();

      await expect(Users.login(email, 'password123')).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });
  });

  describe('loginAsGuest', () => {
    it('ゲストユーザーとしてログインできる', async () => {
      const user = await Users.loginAsGuest();

      expect(user.isGuest).toBe(true);
      expect(user.userName).toBe('ゲスト'); // デフォルト値
      expect(user.email).toBeUndefined();
      expect(user.password).toBeUndefined();

      // データベースの値も確認
      const savedUser = await Users.findById(user._id);
      expect(savedUser?.isGuest).toBe(true);
    });
  });

  describe('updateEmail', () => {
    it('メールアドレスを更新できる', async () => {
      const user = await Users.create({
        _id: userId,
        userName: 'TestUser',
        email: 'old.UserStatics@example.com',
        password: 'password123',
        isGuest: false,
      });

      await Users.updateEmail(
        user._id.toString(),
        'new.UserStatics@example.com',
      );

      const updatedUser = await Users.findById(user._id);
      expect(updatedUser?.email).toBe('new.UserStatics@example.com');
    });

    it('最近削除されたメールアドレスでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email: 'old.UserStatics@example.com',
        password: 'password123',
        isGuest: false,
      });

      // 最近削除されたユーザーを作成
      const deletedUser = await Users.create({
        userName: 'DeletedUser',
        email: 'deleted.UserStatics@example.com',
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(
        Users.updateEmail(userId.toString(), 'deleted.UserStatics@example.com'),
      ).rejects.toThrow();

      await Users.deleteOne({ _id: deletedUser._id });
    });

    it('存在しないユーザーIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Users.updateEmail(nonExistentId, 'new@example.com'),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });

    it('削除されたユーザーでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email: 'old.UserStatics@example.com',
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(
        Users.updateEmail(userId.toString(), 'new.UserStatics@example.com'),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });
  });

  describe('changePassword', () => {
    it('パスワードを変更できる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
        isGuest: false,
      });
      await Users.createIndexes();

      await Users.changePassword(
        userId.toString(),
        'oldpassword123',
        'newpassword123',
      );

      const updatedUser = await Users.findById(userId);
      await expect(
        updatedUser?.matchPassword('newpassword123'),
      ).resolves.toBeUndefined();
    });

    it('現在のパスワードが間違っている場合エラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
        isGuest: false,
      });

      await expect(
        Users.changePassword(
          userId.toString(),
          'wrongpassword',
          'newpassword123',
        ),
      ).rejects.toThrow(errors.WRONG_PASSWORD);
    });

    it('存在しないユーザーIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Users.changePassword(nonExistentId, 'oldpassword', 'newpassword'),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });

    it('削除されたユーザーでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(
        Users.changePassword(
          userId.toString(),
          'oldpassword123',
          'newpassword123',
        ),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });
  });

  describe('resetPassword', () => {
    it('パスワードをリセットできる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
        isGuest: false,
      });

      await Users.resetPassword(email, 'newpassword123');

      const updatedUser = await Users.findById(userId);
      await expect(
        updatedUser?.matchPassword('newpassword123'),
      ).resolves.toBeUndefined();
    });

    it('存在しないメールアドレスでエラーを投げる', async () => {
      await expect(
        Users.resetPassword('nonexistent@example.com', 'newpassword123'),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });

    it('削除されたユーザーでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(
        Users.resetPassword(email, 'newpassword123'),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });
  });

  describe('softDelete', () => {
    it('ユーザーをソフトデリートできる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      await Users.softDelete(userId.toString());

      const deletedUser = await Users.findById(userId);
      expect(deletedUser?.deletedAt).toBeDefined();
    });

    it('存在しないユーザーIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(Users.softDelete(nonExistentId)).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });

    it('削除されたユーザーでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(Users.softDelete(userId.toString())).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });
  });

  describe('findActiveUserById', () => {
    it('アクティブなユーザーを検索できる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      const foundUser = await Users.findActiveUserById(userId.toString());
      expect(foundUser?._id.toString()).toBe(userId.toString());
    });

    it('削除されたユーザーは検索されない', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(Users.findActiveUserById(userId.toString())).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });

    it('存在しないユーザーIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(Users.findActiveUserById(nonExistentId)).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });
  });

  describe('checkEmailRecentlyDeleted', () => {
    it('最近削除されたメールアドレスでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'DeletedUser',
        email,
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(Users.checkEmailRecentlyDeleted(email)).rejects.toThrow(
        errors.EMAIL_RESENTLY_DELETED,
      );
    });

    it('削除されていないメールアドレスでエラーが発生しない', async () => {
      await Users.create({
        _id: userId,
        userName: 'ActiveUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      await expect(
        Users.checkEmailRecentlyDeleted(email),
      ).resolves.not.toThrow();
    });

    it('24時間以上前に削除されたメールアドレスでエラーが発生しない', async () => {
      const oldDeleteTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25時間前
      await Users.create({
        _id: userId,
        userName: 'OldDeletedUser',
        email,
        password: 'password123',
        isGuest: false,
        deletedAt: oldDeleteTime,
      });

      await expect(
        Users.checkEmailRecentlyDeleted(email),
      ).resolves.not.toThrow();
    });

    it('存在しないメールアドレスでエラーが発生しない', async () => {
      await expect(
        Users.checkEmailRecentlyDeleted('nonexistent@example.com'),
      ).resolves.not.toThrow();
    });
  });

  describe('findActiveUserByEmail', () => {
    it('アクティブなユーザーを検索できる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
      });

      const foundUser = await Users.findActiveUserByEmail(email);
      expect(foundUser?._id.toString()).toBe(userId.toString());
    });

    it('削除されたユーザーは検索されない', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(Users.findActiveUserByEmail(email)).rejects.toThrow(
        errors.USER_NOT_FOUND,
      );
    });

    it('存在しないメールアドレスでエラーを投げる', async () => {
      await expect(
        Users.findActiveUserByEmail('nonexistent@example.com'),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });
  });

  describe('updateProfile', () => {
    it('ユーザー名とプロフィール画像を更新できる', async () => {
      await Users.create({
        _id: userId,
        userName: 'OldUserName',
        email,
        password: 'password123',
        pic: 'old-pic.jpg',
        isGuest: false,
      });

      await Users.updateProfile(userId.toString(), {
        userName: 'NewUserName',
        pic: 'new-pic.jpg',
      });

      const updatedUser = await Users.findById(userId);
      expect(updatedUser?.userName).toBe('NewUserName');
      expect(updatedUser?.pic).toBe('new-pic.jpg');
    });

    it('部分的な更新ができる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        pic: 'old-pic.jpg',
        isGuest: false,
      });

      // ユーザー名のみ更新
      await Users.updateProfile(userId.toString(), {
        userName: 'UpdatedUser',
      });

      const updatedUser = await Users.findById(userId);
      expect(updatedUser?.userName).toBe('UpdatedUser');
      expect(updatedUser?.pic).toBe('old-pic.jpg'); // 変更されていない
    });

    it('空のデータで更新してもエラーが発生しない', async () => {
      const originalUserName = 'TestUser';
      const originalPic = 'test-pic.jpg';

      await Users.create({
        _id: userId,
        userName: originalUserName,
        email,
        password: 'password123',
        pic: originalPic,
        isGuest: false,
      });

      await Users.updateProfile(userId.toString(), {});

      const updatedUser = await Users.findById(userId);
      expect(updatedUser?.userName).toBe(originalUserName);
      expect(updatedUser?.pic).toBe(originalPic);
    });

    it('存在しないユーザーIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Users.updateProfile(nonExistentId, { userName: 'NewName' }),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });

    it('削除されたユーザーでエラーを投げる', async () => {
      await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        isGuest: false,
        deletedAt: new Date(),
      });

      await expect(
        Users.updateProfile(userId.toString(), { userName: 'NewName' }),
      ).rejects.toThrow(errors.USER_NOT_FOUND);
    });
  });
});
