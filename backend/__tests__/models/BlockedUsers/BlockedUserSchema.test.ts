import mongoose from 'mongoose';
import BlockedUsers from '../../../src/models/BlockedUsers';
import Users from '../../../src/models/Users';

describe('BlockedUserSchema', () => {
  const channelId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      BlockedUsers.deleteOne({ channelId, userId }),
      Users.deleteOne({ _id: userId }),
    ]);
    await Users.create({
      _id: userId,
      userName: 'TestUser',
      email: 'BlockedUserSchema@example.com',
      password: 'password123',
    });
  });

  describe('バリデーション', () => {
    it('必須フィールドが正しく設定される', async () => {
      const blockedUser = await BlockedUsers.create({
        channelId,
        userId,
      });

      expect(blockedUser.channelId).toBe(channelId);
      expect(blockedUser.userId).toBe(userId);
      expect(blockedUser.createdAt).toBeDefined();
    });

    it('channelIdとuserIdの組み合わせの重複を防ぐ', async () => {
      // 最初のチャンネルユーザーを作成
      await BlockedUsers.create({
        channelId,
        userId,
      });
      await BlockedUsers.createIndexes();

      // 同じ組み合わせで2番目のチャンネルユーザーを作成しようとする
      await expect(
        BlockedUsers.create({
          channelId,
          userId,
        }),
      ).rejects.toThrow();
    });

    it('異なるチャンネルで同じユーザーを追加できる', async () => {
      const secondChannelId = new mongoose.Types.ObjectId();

      // 最初のチャンネルにユーザーを追加
      await BlockedUsers.create({
        channelId,
        userId,
      });

      // 2番目のチャンネルに同じユーザーを追加
      await BlockedUsers.create({
        channelId: secondChannelId,
        userId,
      });

      // 両方のチャンネルユーザーが存在することを確認
      const allBlockedUsers = await BlockedUsers.find({ userId });
      expect(allBlockedUsers).toHaveLength(2);
      await BlockedUsers.deleteOne({ channelId: secondChannelId, userId });
    });

    it('同じチャンネルで異なるユーザーを追加できる', async () => {
      const secondUserId = new mongoose.Types.ObjectId();

      // 最初のユーザーをチャンネルに追加
      await BlockedUsers.create({
        channelId,
        userId,
      });

      // 2番目のユーザーを同じチャンネルに追加
      await BlockedUsers.create({
        channelId,
        userId: secondUserId,
      });

      // 両方のチャンネルユーザーが存在することを確認
      const allBlockedUsers = await BlockedUsers.find({ channelId });
      expect(allBlockedUsers).toHaveLength(2);
      await BlockedUsers.deleteOne({ channelId, userId: secondUserId });
    });
  });

  describe('スキーマ設定', () => {
    it('_idフィールドが存在する', async () => {
      await BlockedUsers.create({
        channelId,
        userId,
      });

      const savedBlockedUser = await BlockedUsers.findOne({
        channelId,
        userId,
      });
      expect(savedBlockedUser?._id).toBeDefined();
    });

    it('__vフィールドが存在しない', async () => {
      await BlockedUsers.create({
        channelId,
        userId,
      });

      const savedBlockedUser = await BlockedUsers.findOne({
        channelId,
        userId,
      });
      expect(savedBlockedUser?.__v).toBeUndefined();
    });

    it('createdAtフィールドが自動設定される', async () => {
      const beforeCreation = new Date();
      await BlockedUsers.create({
        channelId,
        userId,
      });

      const savedBlockedUser = await BlockedUsers.findOne({
        channelId,
        userId,
      });
      expect(savedBlockedUser?.createdAt).toBeDefined();
      expect(savedBlockedUser?.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
    });

    it('timestampsが正しく設定されている（createdAtのみ）', async () => {
      const blockedUser = await BlockedUsers.create({
        channelId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
      });

      expect(blockedUser.createdAt).toBeDefined();
      expect(blockedUser.createdAt).toBeInstanceOf(Date);
      expect((blockedUser as any).updatedAt).toBeUndefined();
    });
  });

  describe('インデックス', () => {
    it('複合ユニークインデックスが正しく作成される', async () => {
      await BlockedUsers.create({
        channelId,
        userId,
      });

      await BlockedUsers.createIndexes();
      const indexes = await BlockedUsers.listIndexes();
      const compoundIndex = indexes.find(
        (index: any) =>
          index.key && index.key.channelId === 1 && index.key.userId === 1,
      );

      expect(compoundIndex).toBeDefined();
      expect(compoundIndex?.unique).toBe(true);
    });

    it('userIdにインデックスが作成される', async () => {
      await BlockedUsers.create({
        channelId,
        userId,
      });

      await BlockedUsers.createIndexes();
      const indexes = await BlockedUsers.listIndexes();
      const userIdIndex = indexes.find(
        (index: any) => index.key && index.key.userId === 1,
      );

      expect(userIdIndex).toBeDefined();
    });
  });

  describe('参照関係', () => {
    it('userIdがUsersモデルを正しく参照する', async () => {
      await BlockedUsers.create({
        channelId,
        userId,
      });

      // populateでユーザー情報を取得
      const populatedBlockedUser = await BlockedUsers.findOne({
        channelId,
        userId,
      }).populate('userId', 'userName email');

      expect(populatedBlockedUser?.userId).toBeDefined();
      expect((populatedBlockedUser?.userId as any).userName).toBe('TestUser');
      expect((populatedBlockedUser?.userId as any).email).toBe(
        'BlockedUserSchema@example.com',
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なObjectIdでエラーが発生する', async () => {
      const invalidObjectId = 'invalid-id';

      await expect(
        BlockedUsers.create({
          channelId: invalidObjectId as any,
          userId,
        }),
      ).rejects.toThrow();
    });
  });
});
