import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Users from '@/models/Users';
import { errors } from '@/config/messages';

describe('UserMethods', () => {
  const userId = new mongoose.Types.ObjectId();
  const email = 'UserMethods@example.com';

  beforeEach(async () => {
    await Users.deleteOne({ _id: userId });
  });

  describe('matchPassword', () => {
    it('正しいパスワードでエラーが発生しない', async () => {
      const password = 'password123';
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password,
      });

      await user.save();

      await expect(user.matchPassword(password)).resolves.not.toThrow();
    });

    it('間違ったパスワードでエラーを投げる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
      });

      await user.save();

      await expect(user.matchPassword('wrongpassword')).rejects.toThrow(
        errors.WRONG_PASSWORD,
      );
    });

    it('パスワードが設定されていない場合エラーを投げる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        isGuest: true,
      });

      await user.save();

      await expect(user.matchPassword('anypassword')).rejects.toThrow();
    });
  });

  describe('softDelete', () => {
    it('ユーザーをソフトデリートできる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
      });

      await user.save();
      expect(user.deletedAt).toBeUndefined();

      await user.softDelete();
      expect(user.deletedAt).toBeDefined();
      expect(user.deletedAt).toBeInstanceOf(Date);

      // データベースの値も確認
      const deletedUser = await Users.findById(user._id);
      expect(deletedUser?.deletedAt).toBeDefined();
    });

    it('削除日時が現在時刻に設定される', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
      });

      await user.save();
      const beforeDelete = new Date();
      await user.softDelete();
      const afterDelete = new Date();

      expect(user.deletedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeDelete.getTime(),
      );
      expect(user.deletedAt!.getTime()).toBeLessThanOrEqual(
        afterDelete.getTime(),
      );
    });
  });

  describe('changePassword', () => {
    it('正しい現在のパスワードでパスワードを変更できる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
        isGuest: false,
      });

      await user.save();
      const originalPassword = user.password;

      await user.changePassword('oldpassword123', 'newpassword123');

      expect(user.matchPassword('newpassword123')).resolves.not.toThrow();
      expect(user.password).not.toBe(originalPassword);

      // データベースの値も確認
      const updatedUser = await Users.findById(user._id);
      await expect(
        updatedUser?.matchPassword('newpassword123'),
      ).resolves.not.toThrow();
    });

    it('ゲストユーザーでエラーを投げる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'GuestUser',
        isGuest: true,
      });

      await user.save();

      await expect(
        user.changePassword('oldpassword', 'newpassword'),
      ).rejects.toThrow(errors.PERMISSION_DENIED);
    });

    it('現在のパスワードが間違っている場合エラーを投げる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
        isGuest: false,
      });

      await user.save();

      await expect(
        user.changePassword('wrongpassword', 'newpassword123'),
      ).rejects.toThrow(errors.WRONG_PASSWORD);
    });

    it('パスワードが設定されていない場合エラーを投げる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        isGuest: true,
      });

      await user.save();

      await expect(
        user.changePassword('anypassword', 'newpassword123'),
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('パスワードをリセットできる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'oldpassword123',
      });

      await user.save();
      const originalPassword = user.password;

      await user.resetPassword('newpassword123');

      expect(user.matchPassword('newpassword123')).resolves.not.toThrow();
      expect(user.password).not.toBe(originalPassword);

      // データベースの値も確認
      const updatedUser = await Users.findById(user._id);
      expect(
        updatedUser?.matchPassword('newpassword123'),
      ).resolves.not.toThrow();
    });
  });

  describe('updateEmail', () => {
    it('メールアドレスを更新できる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
      });

      await user.save();
      const originalEmail = user.email;

      await user.updateEmail('new.UserMethods@example.com');

      expect(user.email).toBe('new.UserMethods@example.com');
      expect(user.email).not.toBe(originalEmail);

      // データベースの値も確認
      const updatedUser = await Users.findById(user._id);
      expect(updatedUser?.email).toBe('new.UserMethods@example.com');
    });
  });

  describe('updateProfile', () => {
    it('ユーザー名とプロフィール画像を更新できる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'OldUserName',
        email,
        password: 'password123',
        pic: 'old-pic.jpg',
      });

      await user.save();
      const originalUserName = user.userName;
      const originalPic = user.pic;

      await user.updateProfile({
        userName: 'NewUserName',
        pic: 'new-pic.jpg',
      });

      expect(user.userName).toBe('NewUserName');
      expect(user.pic).toBe('new-pic.jpg');
      expect(user.userName).not.toBe(originalUserName);
      expect(user.pic).not.toBe(originalPic);

      // データベースの値も確認
      const updatedUser = await Users.findById(user._id);
      expect(updatedUser?.userName).toBe('NewUserName');
      expect(updatedUser?.pic).toBe('new-pic.jpg');
    });

    it('部分的な更新ができる', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        pic: 'old-pic.jpg',
      });

      await user.save();
      const originalUserName = user.userName;

      // ユーザー名のみ更新
      await user.updateProfile({ userName: 'UpdatedUser' });

      expect(user.userName).toBe('UpdatedUser');
      expect(user.pic).toBe('old-pic.jpg'); // 変更されていない
      expect(user.userName).not.toBe(originalUserName);

      // データベースの値も確認
      const updatedUser = await Users.findById(user._id);
      expect(updatedUser?.userName).toBe('UpdatedUser');
      expect(updatedUser?.pic).toBe('old-pic.jpg');
    });

    it('空のデータで更新してもエラーが発生しない', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
        pic: 'test-pic.jpg',
      });

      await user.save();
      const originalUserName = user.userName;
      const originalPic = user.pic;

      await user.updateProfile({});

      expect(user.userName).toBe(originalUserName);
      expect(user.pic).toBe(originalPic);

      // データベースの値も確認
      const updatedUser = await Users.findById(user._id);
      expect(updatedUser?.userName).toBe(originalUserName);
      expect(updatedUser?.pic).toBe(originalPic);
    });
  });
});
