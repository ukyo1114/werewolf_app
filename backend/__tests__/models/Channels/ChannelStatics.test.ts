import mongoose from 'mongoose';
import Channels from '@/models/Channels';
import Users from '@/models/Users';
import AppError from '@/utils/AppError';
import { errors } from '@/config/messages';

describe('ChannelStatics', () => {
  const adminId = new mongoose.Types.ObjectId();
  const nonAdminId = new mongoose.Types.ObjectId();
  const channelId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await Users.create({
      _id: adminId,
      userName: 'Admin',
      email: 'channelStatics@example.com',
      pic: 'https://example.com/pic.jpg',
      password: 'password123',
    });
  });

  afterAll(async () => {
    await Users.deleteOne({ _id: adminId });
  });

  beforeEach(async () => {
    await Channels.deleteOne({ _id: channelId });
    await Channels.create({
      _id: channelId,
      channelName: 'Test Channel',
      channelDescription: 'A test channel',
      channelAdmin: adminId,
      passwordEnabled: false,
    });
  });

  describe('findActiveChannelById', () => {
    it('アクティブなチャンネルを正しく取得できる', async () => {
      const channel = await Channels.findActiveChannelById(
        channelId.toString(),
      );

      expect(channel).toBeDefined();
      expect(channel._id.toString()).toBe(channelId.toString());
      expect(channel.channelName).toBe('Test Channel');
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.findActiveChannelById(nonExistentId),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });

    it('削除されたチャンネルでエラーを投げる', async () => {
      // チャンネルを削除
      await Channels.findByIdAndUpdate(channelId, { deletedAt: new Date() });

      await expect(
        Channels.findActiveChannelById(channelId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });
  });

  describe('getChannelAsAdmin', () => {
    it('管理者ユーザーが正しくチャンネルを取得できる', async () => {
      const channel = await Channels.getChannelAsAdmin(
        channelId.toString(),
        adminId.toString(),
      );

      expect(channel).toBeDefined();
      expect(channel._id.toString()).toBe(channelId.toString());
      expect(channel.channelAdmin.toString()).toBe(adminId.toString());
    });

    it('非管理者ユーザーがアクセスするとエラーを投げる', async () => {
      await expect(
        Channels.getChannelAsAdmin(channelId.toString(), nonAdminId.toString()),
      ).rejects.toThrow(new AppError(403, errors.PERMISSION_DENIED));
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.getChannelAsAdmin(nonExistentId, adminId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });

    it('削除されたチャンネルでエラーを投げる', async () => {
      // チャンネルを削除
      await Channels.findByIdAndUpdate(channelId, { deletedAt: new Date() });

      await expect(
        Channels.getChannelAsAdmin(channelId.toString(), adminId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });
  });

  describe('isChannelAdmin', () => {
    it('管理者ユーザーでtrueを返す', async () => {
      const result = await Channels.isChannelAdmin(
        channelId.toString(),
        adminId.toString(),
      );
      expect(result).toBe(true);
    });

    it('非管理者ユーザーでfalseを返す', async () => {
      const result = await Channels.isChannelAdmin(
        channelId.toString(),
        nonAdminId.toString(),
      );
      expect(result).toBe(false);
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.isChannelAdmin(nonExistentId, adminId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });

    it('削除されたチャンネルでエラーを投げる', async () => {
      await Channels.findByIdAndUpdate(channelId, { deletedAt: new Date() });

      await expect(
        Channels.isChannelAdmin(channelId.toString(), adminId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });
  });

  describe('checkChannelAdmin', () => {
    it('管理者ユーザーで何も返さない', async () => {
      const result = await Channels.checkChannelAdmin(
        channelId.toString(),
        adminId.toString(),
      );
      expect(result).toBeUndefined();
    });

    it('非管理者ユーザーでエラーを投げる', async () => {
      await expect(
        Channels.checkChannelAdmin(channelId.toString(), nonAdminId.toString()),
      ).rejects.toThrow(new AppError(403, errors.PERMISSION_DENIED));
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.checkChannelAdmin(nonExistentId, adminId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });

    it('削除されたチャンネルでエラーを投げる', async () => {
      await Channels.findByIdAndUpdate(channelId, { deletedAt: new Date() });

      await expect(
        Channels.checkChannelAdmin(channelId.toString(), adminId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });
  });

  describe('getChannelList', () => {
    it('削除されていないチャンネルの一覧を取得する', async () => {
      const [channel1, channel2] = await Promise.all([
        Channels.create({
          channelName: 'Channel 1',
          channelDescription: 'First channel',
          channelAdmin: adminId,
        }),
        Channels.create({
          channelName: 'Channel 2',
          channelDescription: 'Second channel',
          channelAdmin: adminId,
        }),
      ]);

      const channelList = await Channels.getChannelList();

      expect(channelList.length).toBeGreaterThanOrEqual(3);
      channelList.forEach((channel) => {
        expect(channel.password).toBeUndefined();
      });
      await Promise.all([
        Channels.deleteOne({ _id: channel1._id }),
        Channels.deleteOne({ _id: channel2._id }),
      ]);
    });

    it('削除されたチャンネルは除外される', async () => {
      // チャンネルを削除
      await Channels.findByIdAndUpdate(channelId, { deletedAt: new Date() });

      const channelList = await Channels.getChannelList();
      channelList.forEach((channel) => {
        expect(channel.deletedAt).toBeUndefined();
      });
    });

    it('channelAdminが正しくpopulateされる', async () => {
      const channelList = await Channels.getChannelList();
      const createdChannel = channelList.find(
        (channel) => channel._id.toString() === channelId.toString(),
      );

      expect(createdChannel?.channelAdmin).toHaveProperty('_id');
      expect(createdChannel?.channelAdmin).toHaveProperty('userName');
      expect(createdChannel?.channelAdmin).toHaveProperty('pic');
    });
  });

  describe('updateChannelSettings', () => {
    it('管理者がチャンネル設定を更新できる', async () => {
      const updateData = {
        channelName: 'Updated Channel',
        channelDescription: 'Updated description',
        passwordEnabled: true,
        password: 'newpassword123',
        denyGuests: true,
        numberOfPlayers: 15,
      };

      const result = await Channels.updateChannelSettings(
        adminId.toString(),
        channelId.toString(),
        updateData,
      );

      expect(result.channelName).toBe('Updated Channel');
      expect(result.channelDescription).toBe('Updated description');
      expect(result.numberOfPlayers).toBe(15);

      // データベースの値も確認
      const updatedChannel = await Channels.findById(channelId);
      expect(updatedChannel?.channelName).toBe('Updated Channel');
      expect(updatedChannel?.denyGuests).toBe(true);
      expect(updatedChannel?.numberOfPlayers).toBe(15);
    });

    it('非管理者が更新しようとするとエラーを投げる', async () => {
      const updateData = {
        channelName: 'Updated Channel',
        channelDescription: 'Updated description',
        passwordEnabled: false,
        password: '',
        denyGuests: true,
        numberOfPlayers: 15,
      };

      await expect(
        Channels.updateChannelSettings(
          nonAdminId.toString(),
          channelId.toString(),
          updateData,
        ),
      ).rejects.toThrow(new AppError(403, errors.PERMISSION_DENIED));
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        channelName: 'Updated Channel',
        channelDescription: 'Updated description',
        passwordEnabled: false,
        password: '',
        denyGuests: true,
        numberOfPlayers: 15,
      };

      await expect(
        Channels.updateChannelSettings(
          adminId.toString(),
          nonExistentId,
          updateData,
        ),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });
  });

  describe('deleteChannel', () => {
    it('管理者がチャンネルを削除できる', async () => {
      await Channels.deleteChannel(channelId.toString(), adminId.toString());

      // チャンネルがソフトデリートされていることを確認
      const deletedChannel = await Channels.findById(channelId);
      expect(deletedChannel?.deletedAt).toBeDefined();
    });

    it('非管理者が削除しようとするとエラーを投げる', async () => {
      await expect(
        Channels.deleteChannel(channelId.toString(), nonAdminId.toString()),
      ).rejects.toThrow(new AppError(403, errors.PERMISSION_DENIED));
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.deleteChannel(nonExistentId, adminId.toString()),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });
  });
});
