import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Users from '@/models/Users';
import AppError from '@/utils/AppError';
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
        new AppError(400, errors.WRONG_PASSWORD),
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
      ).rejects.toThrow(new AppError(400, errors.WRONG_PASSWORD));
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
      const user = await Users.create({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
      });
      await Users.createIndexes();
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
