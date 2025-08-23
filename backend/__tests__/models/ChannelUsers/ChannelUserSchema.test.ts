import mongoose from 'mongoose';
import ChannelUsers from '@/models/ChannelUsers';
import Users from '@/models/Users';

describe('ChannelUserSchema', () => {
  const channelId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      ChannelUsers.deleteOne({ channelId, userId }),
      Users.deleteOne({ _id: userId }),
    ]);
    await Users.create({
      _id: userId,
      userName: 'TestUser',
      email: 'ChannelUserSchema@example.com',
      password: 'password123',
    });
  });

  describe('バリデーション', () => {
    it('必須フィールドが正しく設定される', async () => {
      const channelUser = await ChannelUsers.create({
        channelId,
        userId,
      });

      expect(channelUser.channelId.toString()).toBe(channelId.toString());
      expect(channelUser.userId.toString()).toBe(userId.toString());
      expect(channelUser.createdAt).toBeDefined();
    });

    it('channelIdとuserIdの組み合わせの重複を防ぐ', async () => {
      // 最初のチャンネルユーザーを作成
      await ChannelUsers.create({
        channelId,
        userId,
      });

      // 同じ組み合わせで2番目のチャンネルユーザーを作成しようとする
      await expect(
        ChannelUsers.create({
          channelId,
          userId,
        }),
      ).rejects.toThrow();
    });

    it('異なるチャンネルで同じユーザーを追加できる', async () => {
      const secondChannelId = new mongoose.Types.ObjectId();

      // 最初のチャンネルにユーザーを追加
      await ChannelUsers.create({
        channelId,
        userId,
      });

      // 2番目のチャンネルに同じユーザーを追加
      await ChannelUsers.create({
        channelId: secondChannelId,
        userId,
      });

      // 両方のチャンネルユーザーが存在することを確認
      const allChannelUsers = await ChannelUsers.find({ userId });
      expect(allChannelUsers).toHaveLength(2);
      await ChannelUsers.deleteOne({ channelId: secondChannelId, userId });
    });

    it('同じチャンネルで異なるユーザーを追加できる', async () => {
      const secondUserId = new mongoose.Types.ObjectId();

      // 最初のユーザーをチャンネルに追加
      await ChannelUsers.create({
        channelId,
        userId,
      });

      // 2番目のユーザーを同じチャンネルに追加
      await ChannelUsers.create({
        channelId,
        userId: secondUserId,
      });

      // 両方のチャンネルユーザーが存在することを確認
      const allChannelUsers = await ChannelUsers.find({ channelId });
      expect(allChannelUsers).toHaveLength(2);
      await ChannelUsers.deleteOne({ channelId, userId: secondUserId });
    });
  });

  describe('スキーマ設定', () => {
    it('_idフィールドが存在する', async () => {
      const channelUser = await ChannelUsers.create({
        channelId,
        userId,
      });

      const savedChannelUser = await ChannelUsers.findOne({
        channelId,
        userId,
      });
      expect(savedChannelUser?._id).toBeDefined();
    });

    it('__vフィールドが存在しない', async () => {
      await ChannelUsers.create({
        channelId,
        userId,
      });

      const savedChannelUser = await ChannelUsers.findOne({
        channelId,
        userId,
      });
      expect(savedChannelUser?.__v).toBeUndefined();
    });

    /*     it('updatedAtフィールドが存在しない', async () => {
      const channelUser = new ChannelUsers({
        channelId,
        userId,
      });
      await channelUser.save();

      const savedChannelUser = await ChannelUsers.findOne({
        channelId,
        userId,
      });
      expect(savedChannelUser?.updatedAt).toBeUndefined();
    }); */

    it('createdAtフィールドが自動設定される', async () => {
      const beforeCreation = new Date();
      await ChannelUsers.create({
        channelId,
        userId,
      });

      const savedChannelUser = await ChannelUsers.findOne({
        channelId,
        userId,
      });
      expect(savedChannelUser?.createdAt).toBeDefined();
      expect(savedChannelUser?.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
    });
  });

  describe('インデックス', () => {
    it('channelIdとuserIdの複合ユニークインデックスが作成される', async () => {
      await ChannelUsers.create({
        channelId,
        userId,
      });

      // インデックスが作成されていることを確認
      const indexes = await ChannelUsers.listIndexes();
      const compoundIndex = indexes.find(
        (index: any) =>
          index.key && index.key.channelId === 1 && index.key.userId === 1,
      );

      expect(compoundIndex).toBeDefined();
      expect(compoundIndex.unique).toBe(true);
    });
  });

  describe('参照関係', () => {
    it('userIdがUsersモデルを正しく参照する', async () => {
      await ChannelUsers.create({
        channelId,
        userId,
      });

      // populateでユーザー情報を取得
      const populatedChannelUser = await ChannelUsers.findOne({
        channelId,
        userId,
      }).populate('userId', 'userName email');

      expect(populatedChannelUser?.userId).toBeDefined();
      expect((populatedChannelUser?.userId as any).userName).toBe('TestUser');
      expect((populatedChannelUser?.userId as any).email).toBe(
        'ChannelUserSchema@example.com',
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なObjectIdでエラーが発生する', async () => {
      const invalidObjectId = 'invalid-id';

      await expect(
        ChannelUsers.create({
          channelId: invalidObjectId as any,
          userId,
        }),
      ).rejects.toThrow();
    });
  });
});
