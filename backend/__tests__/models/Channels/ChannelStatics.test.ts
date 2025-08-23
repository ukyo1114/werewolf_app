import mongoose from 'mongoose';
import Channels from '@/models/Channels';
import Users from '@/models/Users';
import { errors } from '@/config/messages';

describe('ChannelStatics', () => {
  const adminId = new mongoose.Types.ObjectId().toString();
  const nonAdminId = new mongoose.Types.ObjectId().toString();
  const channelId = new mongoose.Types.ObjectId().toString();

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

  describe('getChannelAsAdmin', () => {
    it('管理者ユーザーが正しくチャンネルを取得できる', async () => {
      const channel = await Channels.getChannelAsAdmin(channelId, adminId);

      expect(channel).toBeDefined();
      expect(channel._id.toString()).toBe(channelId);
      expect(channel.channelAdmin.toString()).toBe(adminId);
    });

    it('非管理者ユーザーがアクセスするとエラーを投げる', async () => {
      await expect(
        Channels.getChannelAsAdmin(channelId, nonAdminId),
      ).rejects.toThrow(errors.PERMISSION_DENIED);
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.getChannelAsAdmin(nonExistentId, adminId),
      ).rejects.toThrow(errors.CHANNEL_NOT_FOUND);
    });

    it('削除されたチャンネルでエラーを投げる', async () => {
      // チャンネルを削除
      const channel = await Channels.findById(channelId);
      await channel?.softDelete();

      await expect(
        Channels.getChannelAsAdmin(channelId, adminId),
      ).rejects.toThrow(errors.CHANNEL_NOT_FOUND);
    });
  });

  describe('isChannelAdmin', () => {
    it('管理者ユーザーでtrueを返す', async () => {
      const result = await Channels.isChannelAdmin(channelId, adminId);
      expect(result).toBe(true);
    });

    it('非管理者ユーザーでfalseを返す', async () => {
      const result = await Channels.isChannelAdmin(channelId, nonAdminId);
      expect(result).toBe(false);
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.isChannelAdmin(nonExistentId, adminId),
      ).rejects.toThrow(errors.CHANNEL_NOT_FOUND);
    });

    it('削除されたチャンネルでエラーを投げる', async () => {
      // チャンネルを削除
      const channel = await Channels.findById(channelId);
      await channel?.softDelete();

      await expect(Channels.isChannelAdmin(channelId, adminId)).rejects.toThrow(
        errors.CHANNEL_NOT_FOUND,
      );
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
      const channel = await Channels.findById(channelId);
      await channel?.softDelete();

      const channelList = await Channels.getChannelList();
      channelList.forEach((channel) => {
        expect(channel.deletedAt).toBeUndefined();
      });
    });

    it('channelAdminが正しくpopulateされる', async () => {
      const channelList = await Channels.getChannelList();

      expect(channelList[0].channelAdmin).toHaveProperty('_id');
      expect(channelList[0].channelAdmin).toHaveProperty('userName');
      expect(channelList[0].channelAdmin).toHaveProperty('pic');
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
        adminId,
        channelId,
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
        Channels.updateChannelSettings(nonAdminId, channelId, updateData),
      ).rejects.toThrow(errors.PERMISSION_DENIED);
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
        Channels.updateChannelSettings(adminId, nonExistentId, updateData),
      ).rejects.toThrow(errors.CHANNEL_NOT_FOUND);
    });
  });

  describe('deleteChannel', () => {
    it('管理者がチャンネルを削除できる', async () => {
      await Channels.deleteChannel(channelId, adminId);

      // チャンネルがソフトデリートされていることを確認
      const deletedChannel = await Channels.findById(channelId);
      expect(deletedChannel?.deletedAt).toBeDefined();
    });

    it('非管理者が削除しようとするとエラーを投げる', async () => {
      await expect(
        Channels.deleteChannel(channelId, nonAdminId),
      ).rejects.toThrow(errors.PERMISSION_DENIED);
    });

    it('存在しないチャンネルIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channels.deleteChannel(nonExistentId, adminId),
      ).rejects.toThrow(errors.CHANNEL_NOT_FOUND);
    });
  });
});
