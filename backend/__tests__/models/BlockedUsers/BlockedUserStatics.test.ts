import mongoose from 'mongoose';
import BlockedUsers from '@/models/BlockedUsers';
import Users from '@/models/Users';
import AppError from '@/utils/AppError';
import { errors } from '@/config/messages';

describe('BlockedUserStatics', () => {
  const channelId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const secondChannelId = new mongoose.Types.ObjectId();
  const secondUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      BlockedUsers.deleteOne({ channelId, userId }),
      Users.deleteOne({ _id: userId }),
    ]);
    await Users.create({
      _id: userId,
      userName: 'TestUser',
      email: 'BlockedUserStatics@example.com',
      pic: 'pic.jpg',
      password: 'password123',
    });
  });

  describe('getBlockUserList', () => {
    it('指定されたチャンネルのブロックされたユーザー一覧を取得する', async () => {
      // テストデータを作成
      await BlockedUsers.create([{ channelId, userId }]);

      const blockedUsers = await BlockedUsers.getBlockedUserList(
        channelId.toString(),
      );

      expect(blockedUsers).toHaveLength(1);
      expect(blockedUsers[0]).toEqual({
        _id: userId,
        userName: 'TestUser',
        pic: 'pic.jpg',
        isGuest: false,
      });

      await BlockedUsers.deleteOne({ channelId, userId: secondUserId });
    });

    it('指定されたチャンネルにブロックされたユーザーがいない場合は空配列を返す', async () => {
      const blockedUsers = await BlockedUsers.getBlockedUserList(
        channelId.toString(),
      );
      expect(blockedUsers).toHaveLength(0);
    });

    it('存在しないチャンネルIDで空配列を返す', async () => {
      const nonExistentChannelId = new mongoose.Types.ObjectId().toString();
      const users = await BlockedUsers.getBlockedUserList(nonExistentChannelId);
      expect(users).toHaveLength(0);
    });

    it('異なるチャンネルのブロックされたユーザーは含まれない', async () => {
      await BlockedUsers.create({ channelId, userId });

      // channelId2のブロックされたユーザーを取得
      const blockedUsers = await BlockedUsers.getBlockedUserList(
        secondChannelId.toString(),
      );

      expect(blockedUsers).toHaveLength(0);
    });
  });

  describe('isUserBlocked', () => {
    it('ブロックされたユーザーの場合、trueを返す', async () => {
      await BlockedUsers.create({ channelId, userId });

      const isBlocked = await BlockedUsers.isUserBlocked(
        channelId.toString(),
        userId.toString(),
      );

      expect(isBlocked).toBe(true);
    });

    it('ブロックされていないユーザーの場合、falseを返す', async () => {
      const isBlocked = await BlockedUsers.isUserBlocked(
        channelId.toString(),
        userId.toString(),
      );

      expect(isBlocked).toBe(false);
    });

    it('存在しないチャンネルIDでfalseを返す', async () => {
      const nonExistentChannelId = new mongoose.Types.ObjectId().toString();
      const isInChannel = await BlockedUsers.isUserBlocked(
        nonExistentChannelId,
        userId.toString(),
      );

      expect(isInChannel).toBe(false);
    });

    it('存在しないユーザーIDでfalseを返す', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const isInChannel = await BlockedUsers.isUserBlocked(
        channelId.toString(),
        nonExistentUserId,
      );

      expect(isInChannel).toBe(false);
    });

    it('異なるチャンネルではfalseを返す', async () => {
      await BlockedUsers.create({ channelId, userId });

      // channelId2でチェック
      const isBlocked = await BlockedUsers.isUserBlocked(
        secondChannelId.toString(),
        userId.toString(),
      );

      expect(isBlocked).toBe(false);
    });
  });

  describe('cancelBlock', () => {
    it('ブロックされたユーザーをブロック解除する', async () => {
      // ブロックされたユーザーを作成
      await BlockedUsers.create({ channelId, userId });

      // ブロック解除
      await BlockedUsers.cancelBlock(channelId.toString(), userId.toString());

      // ブロック解除されたことを確認
      const isBlocked = await BlockedUsers.isUserBlocked(
        channelId.toString(),
        userId.toString(),
      );
      expect(isBlocked).toBe(false);
    });

    it('存在しないブロックユーザーを解除しようとした場合、エラーが発生する', async () => {
      await expect(
        BlockedUsers.cancelBlock(channelId.toString(), userId.toString()),
      ).rejects.toThrow(new AppError(404, errors.USER_NOT_BLOCKED));
    });

    it('ブロック解除後にドキュメントが削除される', async () => {
      // ブロックされたユーザーを作成
      await BlockedUsers.create({ channelId, userId });

      // ブロック解除
      await BlockedUsers.cancelBlock(channelId.toString(), userId.toString());

      // ドキュメントが削除されたことを確認
      const count = await BlockedUsers.countDocuments({ channelId, userId });
      expect(count).toBe(0);
    });
  });

  describe('getBlockedChannels', () => {
    it('指定されたユーザーがブロックされているチャンネル一覧を取得する', async () => {
      await BlockedUsers.create([
        { channelId, userId },
        { channelId: secondChannelId, userId },
      ]);

      const blockedChannels = await BlockedUsers.getBlockedChannels(
        userId.toString(),
      );

      expect(blockedChannels).toHaveLength(2);
      expect(blockedChannels).toContain(channelId.toString());
      expect(blockedChannels).toContain(secondChannelId.toString());

      await BlockedUsers.deleteOne({ channelId: secondChannelId, userId });
    });

    it('ブロックされていないユーザーの場合は空配列を返す', async () => {
      const blockedChannels = await BlockedUsers.getBlockedChannels(
        userId.toString(),
      );

      expect(blockedChannels).toHaveLength(0);
    });

    it('異なるユーザーのブロックチャンネルは含まれない', async () => {
      await BlockedUsers.create({ channelId, userId: secondUserId });

      const blockedChannels = await BlockedUsers.getBlockedChannels(
        userId.toString(),
      );

      expect(blockedChannels).toHaveLength(0);

      await BlockedUsers.deleteOne({ channelId, userId: secondUserId });
    });

    it('存在しないユーザーIDで空配列を返す', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const blockedChannels =
        await BlockedUsers.getBlockedChannels(nonExistentUserId);

      expect(blockedChannels).toHaveLength(0);
    });

    it('チャンネルIDが文字列として返される', async () => {
      // チャンネルユーザーを作成
      await BlockedUsers.create({
        channelId,
        userId,
      });

      const blockedChannels = await BlockedUsers.getBlockedChannels(
        userId.toString(),
      );

      expect(blockedChannels).toHaveLength(1);
      expect(typeof blockedChannels[0]).toBe('string');
      expect(blockedChannels[0]).toBe(channelId.toString());
    });
  });

  describe('統合テスト', () => {
    it('ユーザーのブロックとブロック解除の一連の流れ', async () => {
      // 初期状態ではブロックされていない
      let isBlocked = await BlockedUsers.isUserBlocked(
        channelId.toString(),
        userId.toString(),
      );
      expect(isBlocked).toBe(false);

      // ユーザーをブロック
      await BlockedUsers.create({ channelId, userId });

      // ブロックされたことを確認
      isBlocked = await BlockedUsers.isUserBlocked(
        channelId.toString(),
        userId.toString(),
      );
      expect(isBlocked).toBe(true);

      // ブロックされたユーザー一覧に含まれることを確認
      const blockedUsers = await BlockedUsers.getBlockedUserList(
        channelId.toString(),
      );
      expect(blockedUsers).toHaveLength(1);
      expect(blockedUsers[0]._id.toString()).toBe(userId.toString());

      // ブロックされたチャンネル一覧に含まれることを確認
      const blockedChannels = await BlockedUsers.getBlockedChannels(
        userId.toString(),
      );
      expect(blockedChannels).toHaveLength(1);
      expect(blockedChannels[0]).toBe(channelId.toString());

      // ブロック解除
      await BlockedUsers.cancelBlock(channelId.toString(), userId.toString());

      // ブロック解除されたことを確認
      isBlocked = await BlockedUsers.isUserBlocked(
        channelId.toString(),
        userId.toString(),
      );
      expect(isBlocked).toBe(false);

      // ブロックされたユーザー一覧から削除されたことを確認
      const blockedUsersAfter = await BlockedUsers.getBlockedUserList(
        channelId.toString(),
      );
      expect(blockedUsersAfter).toHaveLength(0);

      // ブロックされたチャンネル一覧から削除されたことを確認
      const blockedChannelsAfter = await BlockedUsers.getBlockedChannels(
        userId.toString(),
      );
      expect(blockedChannelsAfter).toHaveLength(0);
    });

    it('複数のチャンネルとユーザーでの動作確認', async () => {
      const channelId1 = new mongoose.Types.ObjectId();
      const channelId2 = new mongoose.Types.ObjectId();
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();

      // 複数のブロック関係を作成
      await BlockedUsers.create([
        { channelId: channelId1, userId: userId1 },
        { channelId: channelId1, userId: userId2 },
        { channelId: channelId2, userId: userId1 },
      ]);

      // channelId1のブロックされたユーザー
      const blockedUsers1 = await BlockedUsers.getBlockedUserList(
        channelId1.toString(),
      );
      expect(blockedUsers1).toHaveLength(2);

      // channelId2のブロックされたユーザー
      const blockedUsers2 = await BlockedUsers.getBlockedUserList(
        channelId2.toString(),
      );
      expect(blockedUsers2).toHaveLength(1);

      // userId1がブロックされているチャンネル
      const blockedChannels1 = await BlockedUsers.getBlockedChannels(
        userId1.toString(),
      );
      expect(blockedChannels1).toHaveLength(2);

      // userId2がブロックされているチャンネル
      const blockedChannels2 = await BlockedUsers.getBlockedChannels(
        userId2.toString(),
      );
      expect(blockedChannels2).toHaveLength(1);
    });
  });
});
