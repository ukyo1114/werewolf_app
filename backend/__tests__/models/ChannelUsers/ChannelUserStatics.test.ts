import mongoose from 'mongoose';
import ChannelUsers from '../../../src/models/ChannelUsers';
import Users from '../../../src/models/Users';
import AppError from '../../../src/utils/AppError';
import { errors } from '../../../src/config/messages';

describe('ChannelUserStatics', () => {
  const channelId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const secondChannelId = new mongoose.Types.ObjectId();
  const secondUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      ChannelUsers.deleteMany({ channelId }),
      Users.deleteOne({ _id: userId }),
    ]);
    await Users.create({
      _id: userId,
      userName: 'TestUser',
      email: 'ChannelUserStatics@example.com',
      pic: 'pic.jpg',
      password: 'password123',
    });
  });

  describe('getChannelUsers', () => {
    it('チャンネル内のユーザー一覧を取得できる', async () => {
      await ChannelUsers.create({
        channelId,
        userId,
      });

      const users = await ChannelUsers.getChannelUsers(channelId.toString());

      expect(users).toHaveLength(1);
      expect(users[0]).toEqual({
        _id: userId,
        userName: 'TestUser',
        pic: 'pic.jpg',
        isGuest: false,
      });
    });

    it('複数のユーザーがいるチャンネルのユーザー一覧を取得できる', async () => {
      await Users.create({
        _id: secondUserId,
        userName: 'secondUser',
        email: 'secondUser.ChannelUserStatics@example.com',
        pic: 'secondPic.jpg',
        password: 'password123',
      });

      await ChannelUsers.create({
        channelId,
        userId,
      });
      await ChannelUsers.create({
        channelId,
        userId: secondUserId,
      });

      const users = await ChannelUsers.getChannelUsers(channelId.toString());

      expect(users).toHaveLength(2);
      expect(users).toContainEqual({
        _id: userId,
        userName: 'TestUser',
        pic: 'pic.jpg',
        isGuest: false,
      });
      expect(users).toContainEqual({
        _id: secondUserId,
        userName: 'secondUser',
        pic: 'secondPic.jpg',
        isGuest: false,
      });

      await Promise.all([
        ChannelUsers.deleteOne({ channelId, userId: secondUserId }),
        Users.deleteOne({ _id: secondUserId }),
      ]);
    });

    it('ユーザーがいないチャンネルで空配列を返す', async () => {
      const users = await ChannelUsers.getChannelUsers(channelId.toString());
      expect(users).toHaveLength(0);
    });

    it('存在しないチャンネルIDで空配列を返す', async () => {
      const nonExistentChannelId = new mongoose.Types.ObjectId().toString();
      const users = await ChannelUsers.getChannelUsers(nonExistentChannelId);
      expect(users).toHaveLength(0);
    });
  });

  describe('isUserInChannel', () => {
    it('ユーザーがチャンネルにいる場合trueを返す', async () => {
      // チャンネルユーザーを作成
      await ChannelUsers.create({
        channelId,
        userId,
      });

      const isInChannel = await ChannelUsers.isUserInChannel(
        channelId.toString(),
        userId.toString(),
      );

      expect(isInChannel).toBe(true);
    });

    it('ユーザーがチャンネルにいない場合falseを返す', async () => {
      const isInChannel = await ChannelUsers.isUserInChannel(
        channelId.toString(),
        userId.toString(),
      );

      expect(isInChannel).toBe(false);
    });

    it('存在しないチャンネルIDでfalseを返す', async () => {
      const nonExistentChannelId = new mongoose.Types.ObjectId().toString();
      const isInChannel = await ChannelUsers.isUserInChannel(
        nonExistentChannelId,
        userId.toString(),
      );

      expect(isInChannel).toBe(false);
    });

    it('存在しないユーザーIDでfalseを返す', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const isInChannel = await ChannelUsers.isUserInChannel(
        channelId.toString(),
        nonExistentUserId,
      );

      expect(isInChannel).toBe(false);
    });
  });

  describe('checkUserInChannel', () => {
    it('ユーザーがチャンネルにいる場合何もしない', async () => {
      // チャンネルユーザーを作成
      await ChannelUsers.create({
        channelId,
        userId,
      });

      const result = await ChannelUsers.checkUserInChannel(
        channelId.toString(),
        userId.toString(),
      );

      expect(result).toBeUndefined();
    });

    it('ユーザーがチャンネルにいない場合エラーを投げる', async () => {
      await expect(
        ChannelUsers.checkUserInChannel(
          channelId.toString(),
          userId.toString(),
        ),
      ).rejects.toThrow(new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN));
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentChannelId = new mongoose.Types.ObjectId().toString();
      await expect(
        ChannelUsers.checkUserInChannel(
          nonExistentChannelId,
          userId.toString(),
        ),
      ).rejects.toThrow(new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN));
    });

    it('存在しないユーザーIDでエラーを投げる', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      await expect(
        ChannelUsers.checkUserInChannel(
          channelId.toString(),
          nonExistentUserId,
        ),
      ).rejects.toThrow(new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN));
    });
  });

  describe('getParticipantingChannels', () => {
    it('ユーザーが参加しているチャンネル一覧を取得できる', async () => {
      // 複数のチャンネルにユーザーを参加させる
      await ChannelUsers.create({
        channelId,
        userId,
      });

      await ChannelUsers.create({
        channelId: secondChannelId,
        userId,
      });

      const participatingChannels =
        await ChannelUsers.getParticipantingChannels(userId.toString());

      expect(participatingChannels).toHaveLength(2);
      expect(participatingChannels).toContain(channelId.toString());
      expect(participatingChannels).toContain(secondChannelId.toString());

      await ChannelUsers.deleteOne({ channelId: secondChannelId, userId });
    });

    it('ユーザーが参加しているチャンネルがない場合空配列を返す', async () => {
      const participatingChannels =
        await ChannelUsers.getParticipantingChannels(userId.toString());

      expect(participatingChannels).toHaveLength(0);
    });

    it('存在しないユーザーIDで空配列を返す', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const participatingChannels =
        await ChannelUsers.getParticipantingChannels(nonExistentUserId);

      expect(participatingChannels).toHaveLength(0);
    });

    it('チャンネルIDが文字列として返される', async () => {
      // チャンネルユーザーを作成
      await ChannelUsers.create({
        channelId,
        userId,
      });

      const participatingChannels =
        await ChannelUsers.getParticipantingChannels(userId.toString());

      expect(participatingChannels).toHaveLength(1);
      expect(typeof participatingChannels[0]).toBe('string');
      expect(participatingChannels[0]).toBe(channelId.toString());
    });
  });

  describe('統合テスト', () => {
    it('典型的なワークフローが正常に動作する', async () => {
      // 1. ユーザーがチャンネルに参加
      await ChannelUsers.create({
        channelId,
        userId,
      });

      // 2. ユーザーがチャンネルにいることを確認
      let isInChannel = await ChannelUsers.isUserInChannel(
        channelId.toString(),
        userId.toString(),
      );
      expect(isInChannel).toBe(true);

      // 3. チャンネル内のユーザー一覧を取得
      const users = await ChannelUsers.getChannelUsers(channelId.toString());
      expect(users).toHaveLength(1);
      expect(users[0].userName).toBe('TestUser');

      // 4. ユーザーが参加しているチャンネル一覧を取得
      const participatingChannels =
        await ChannelUsers.getParticipantingChannels(userId.toString());
      expect(participatingChannels).toHaveLength(1);
      expect(participatingChannels[0]).toBe(channelId.toString());

      // 5. ユーザーがチャンネルから退出
      await ChannelUsers.deleteOne({ channelId, userId });

      // 6. 退出後、ユーザーがチャンネルにいないことを確認
      isInChannel = await ChannelUsers.isUserInChannel(
        channelId.toString(),
        userId.toString(),
      );
      expect(isInChannel).toBe(false);

      // 7. チャンネル内のユーザー一覧が空になることを確認
      const emptyUsers = await ChannelUsers.getChannelUsers(
        channelId.toString(),
      );
      expect(emptyUsers).toHaveLength(0);
    });
  });
});
