import Channel from '../../src/models/Channel';
import User from '../../src/models/User';
import mongoose from 'mongoose';

describe('Channel Model Test', () => {
  let adminId: string;
  let nonAdminId: string;

  beforeAll(async () => {
    // データベースのクリーンアップ
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }

    // テストに必要なユーザーを作成
    const admin = await User.create({
      userName: 'adminUser',
      email: 'admin@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    adminId = admin._id.toString();

    const nonAdmin = await User.create({
      userName: 'nonAdminUser',
      email: 'nonadmin@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    });
    nonAdminId = nonAdmin._id.toString();
  });

  beforeEach(async () => {
    await Channel.deleteMany({});
  });

  describe('Channel Creation', () => {
    it('should create a new channel with default values', async () => {
      const channel = await Channel.create({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
      });

      expect(channel.channelName).toBe('Test Channel');
      expect(channel.channelDescription).toBe('A test channel');
      expect(channel.passwordEnabled).toBe(false);
      expect(channel.password).toBeUndefined();
      expect(channel.channelAdmin.toString()).toBe(adminId);
      expect(channel.denyGuests).toBe(false);
      expect(channel.numberOfPlayers).toBe(10);
    });

    it('should create a channel with password protection', async () => {
      const channel = await Channel.create({
        channelName: 'Protected Channel',
        channelDescription: 'A password protected channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'securepass123',
      });

      expect(channel.channelName).toBe('Protected Channel');
      expect(channel.passwordEnabled).toBe(true);
      expect(channel.password).not.toBe('securepass123');
      expect(await channel.matchPassword('securepass123')).toBe(true);
      expect(await channel.matchPassword('wrongpass')).toBe(false);
    });

    it('should create a channel with custom player limit', async () => {
      const channel = await Channel.create({
        channelName: 'Custom Channel',
        channelDescription: 'A channel with custom player limit',
        channelAdmin: adminId,
        numberOfPlayers: 15,
      });

      expect(channel.numberOfPlayers).toBe(15);
    });
  });

  describe('Password Handling', () => {
    it('should remove password when password protection is disabled', async () => {
      const channel = await Channel.create({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'securepass123',
      });

      channel.passwordEnabled = false;
      await channel.save();

      expect(channel.passwordEnabled).toBe(false);
      expect(channel.password).toBeUndefined();
    });

    it('should hash password when password is modified', async () => {
      const channel = await Channel.create({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'securepass123',
      });

      const originalPassword = channel.password;
      channel.password = 'newpass123';
      await channel.save();

      expect(channel.password).not.toBe(originalPassword);
      expect(channel.password).not.toBe('newpass123');
      expect(await channel.matchPassword('newpass123')).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should not create channel with name longer than 50 characters', async () => {
      await expect(
        Channel.create({
          channelName: 'a'.repeat(51),
          channelDescription: 'A test channel',
          channelAdmin: adminId,
        }),
      ).rejects.toThrow();
    });

    it('should not create channel with description longer than 2000 characters', async () => {
      await expect(
        Channel.create({
          channelName: 'Test Channel',
          channelDescription: 'a'.repeat(2001),
          channelAdmin: adminId,
        }),
      ).rejects.toThrow();
    });

    it('should not create channel with password shorter than 8 characters', async () => {
      await expect(
        Channel.create({
          channelName: 'Test Channel',
          channelDescription: 'A test channel',
          channelAdmin: adminId,
          passwordEnabled: true,
          password: 'short',
        }),
      ).rejects.toThrow();
    });

    it('should not create channel with player limit less than 5', async () => {
      await expect(
        Channel.create({
          channelName: 'Test Channel',
          channelDescription: 'A test channel',
          channelAdmin: adminId,
          numberOfPlayers: 4,
        }),
      ).rejects.toThrow();
    });

    it('should not create channel with player limit more than 20', async () => {
      await expect(
        Channel.create({
          channelName: 'Test Channel',
          channelDescription: 'A test channel',
          channelAdmin: adminId,
          numberOfPlayers: 21,
        }),
      ).rejects.toThrow();
    });

    it('should require password when password protection is enabled', async () => {
      await expect(
        Channel.create({
          channelName: 'Test Channel',
          channelDescription: 'A test channel',
          channelAdmin: adminId,
          passwordEnabled: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Admin Check', () => {
    it('should return true when user is channel admin', async () => {
      const channel = await Channel.create({
        channelName: 'Admin Channel',
        channelDescription: 'A channel with admin',
        channelAdmin: adminId,
      });

      const isAdmin = await Channel.isChannelAdmin(
        channel._id.toString(),
        adminId,
      );
      expect(isAdmin).toBe(true);
    });

    it('should return false when user is not channel admin', async () => {
      const channel = await Channel.create({
        channelName: 'Admin Channel',
        channelDescription: 'A channel with admin',
        channelAdmin: adminId,
      });

      const isAdmin = await Channel.isChannelAdmin(
        channel._id.toString(),
        nonAdminId,
      );
      expect(isAdmin).toBe(false);
    });

    it('should return false when channel does not exist', async () => {
      const nonExistentChannelId = new mongoose.Types.ObjectId().toString();
      const isAdmin = await Channel.isChannelAdmin(
        nonExistentChannelId,
        adminId,
      );
      expect(isAdmin).toBe(false);
    });

    it('should return false when user id is invalid', async () => {
      const channel = await Channel.create({
        channelName: 'Admin Channel',
        channelDescription: 'A channel with admin',
        channelAdmin: adminId,
      });

      const invalidUserId = 'invalid-user-id';
      const isAdmin = await Channel.isChannelAdmin(
        channel._id.toString(),
        invalidUserId,
      );
      expect(isAdmin).toBe(false);
    });
  });
});
