import mongoose from 'mongoose';
import Users from '../../../src/models/Users';

describe('UserSchema', () => {
  const userId = new mongoose.Types.ObjectId();
  const duplicateUserId = new mongoose.Types.ObjectId();
  const email = 'UserSchema@example.com';

  beforeEach(async () => {
    await Users.deleteOne({ _id: userId });
    await Users.deleteOne({ _id: duplicateUserId });
  });

  describe('バリデーション', () => {
    it('必須フィールドが正しく設定される', async () => {
      const user = new Users({
        userName: 'TestUser',
        email,
        password: 'password123',
      });

      expect(user.userName).toBe('TestUser');
      expect(user.email).toBe(email);
      expect(user.password).toBe('password123');
      expect(user.isGuest).toBe(false); // デフォルト値
    });

    it('userNameの最大長制限', async () => {
      const longUserName = 'a'.repeat(21);
      const user = new Users({
        _id: userId,
        userName: longUserName,
        email,
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('userNameのデフォルト値', async () => {
      const user = new Users({
        _id: userId,
        email,
        password: 'password123',
        isGuest: true,
      });

      await user.save();
      expect(user.userName).toBe('ゲスト');
    });

    it('emailの形式バリデーション', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email: 'invalid-email',
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('emailの重複登録を防ぐ', async () => {
      // 最初のユーザーを作成
      const firstUser = new Users({
        _id: userId,
        userName: 'FirstUser',
        email: 'alreadyRegistered.UserSchema@example.com',
        password: 'password123',
      });
      await firstUser.save();
      await Users.createIndexes();

      // 同じemailで2番目のユーザーを作成しようとする
      const secondUser = new Users({
        _id: duplicateUserId,
        userName: 'SecondUser',
        email: 'alreadyRegistered.UserSchema@example.com',
        password: 'password456',
      });

      // 重複エラーが発生することを確認
      await expect(secondUser.save()).rejects.toThrow();
    });

    it('passwordの最小長制限', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'a'.repeat(7),
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('ゲストユーザーの作成', async () => {
      const user = new Users({
        _id: userId,
        userName: 'GuestUser',
        isGuest: true,
      });

      await user.save();
      expect(user.isGuest).toBe(true);
      expect(user.email).toBeUndefined();
      expect(user.password).toBeUndefined();
    });
  });

  describe('タイムスタンプ', () => {
    it('作成日時と更新日時が自動設定される', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
      });

      await user.save();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('更新時にupdatedAtが更新される', async () => {
      const user = new Users({
        _id: userId,
        userName: 'TestUser',
        email,
        password: 'password123',
      });

      await user.save();
      const originalUpdatedAt = user.updatedAt;

      // 少し待ってから更新
      await new Promise((resolve) => setTimeout(resolve, 10));
      user.userName = 'UpdatedUser';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe('インデックス', () => {
    it('emailとdeletedAtの複合インデックスが存在する', async () => {
      await Users.createIndexes();
      const indexes = await Users.collection.indexes();
      const emailDeletedIndex = indexes.find(
        (index: any) =>
          index.key && index.key.email === 1 && index.key.deletedAt === 1,
      );

      expect(emailDeletedIndex).toBeDefined();
    });
  });
});
