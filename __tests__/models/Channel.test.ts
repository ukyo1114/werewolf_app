import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import mongoose from 'mongoose';
import { errors } from '../../src/config/messages';
import AppError from '../../src/utils/AppError';

describe('Channel Model Test', () => {
  const adminId = new mongoose.Types.ObjectId().toString();
  const nonAdminId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    await User.create({
      _id: adminId,
      userName: 'Admin',
      email: 'admin@example.com',
      password: 'password',
    });
  });

  afterEach(async () => {
    await Channel.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
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
      expect(channel.password).toBeNull();
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
      expect(channel.password).toBeNull();
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
    let channelId: string;

    beforeEach(async () => {
      const channel = await Channel.create({
        channelName: 'Admin Channel',
        channelDescription: 'A channel with admin',
        channelAdmin: adminId,
      });
      channelId = channel._id.toString();
    });

    it('should return true when user is channel admin', async () => {
      const isAdmin = await Channel.isChannelAdmin(channelId, adminId);
      expect(isAdmin).toBe(true);
    });

    it('should return false when user is not channel admin', async () => {
      const isAdmin = await Channel.isChannelAdmin(channelId, nonAdminId);
      expect(isAdmin).toBe(false);
    });

    it('should return false when channel does not exist', async () => {
      const nonExistentChannelId = new mongoose.Types.ObjectId().toString();
      await expect(
        Channel.isChannelAdmin(nonExistentChannelId, adminId),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });

    it('should return false when user id is invalid', async () => {
      const invalidUserId = 'invalid-user-id';
      const isAdmin = await Channel.isChannelAdmin(channelId, invalidUserId);
      expect(isAdmin).toBe(false);
    });
  });

  describe('test getChannelList', () => {
    it('should return all channels', async () => {
      const channels = await Channel.getChannelList();
      expect(channels.length).toBe(0);
    });

    it('should return all channels correctly', async () => {
      const channel = await Channel.create({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'securepass123',
      });
      const channelId = channel._id;

      const channels = await Channel.getChannelList();
      expect(channels[0]).toEqual({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: {
          _id: new mongoose.Types.ObjectId(adminId),
          userName: 'Admin',
          pic: null,
        },
        denyGuests: false,
        passwordEnabled: true,
        numberOfPlayers: 10,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('test updateChannelSettings', () => {
    const protectedChannelId = new mongoose.Types.ObjectId().toString();
    const nonprotectedChannelId = new mongoose.Types.ObjectId().toString();
    const nonAdminId = new mongoose.Types.ObjectId().toString();
    beforeEach(async () => {
      await Promise.all([
        Channel.create({
          _id: protectedChannelId,
          channelName: 'Test Channel',
          channelDescription: 'A test channel',
          channelAdmin: adminId,
          passwordEnabled: true,
          password: 'securepass123',
        }),
        Channel.create({
          _id: nonprotectedChannelId,
          channelName: 'Test Channel',
          channelDescription: 'A test channel',
          channelAdmin: adminId,
        }),
      ]);
    });
    afterEach(async () => {
      await Channel.deleteMany({});
    });

    it('should update channel settings correctly', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: true,
          password: 'newpass123',
          denyGuests: true,
          numberOfPlayers: 15,
        });

      expect(channelName).toBe('Updated Channel');
      expect(channelDescription).toBe('Updated description');
      expect(numberOfPlayers).toBe(15);

      const channel = await Channel.findById(protectedChannelId);
      expect(channel?.channelName).toBe('Updated Channel');
      expect(channel?.channelDescription).toBe('Updated description');
      expect(channel?.passwordEnabled).toBe(true);
      expect(await channel?.matchPassword('newpass123')).toBe(true);
      expect(channel?.denyGuests).toBe(true);
      expect(channel?.numberOfPlayers).toBe(15);
    });

    it('should update channel name', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: null,
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 10,
        });

      expect(channelName).toBe('Updated Channel');
      expect(channelDescription).toBe('A test channel');
      expect(numberOfPlayers).toBe(10);

      const channel = await Channel.findById(protectedChannelId);
      expect(channel?.channelName).toBe('Updated Channel');
      expect(channel?.channelDescription).toBe('A test channel');
      expect(channel?.passwordEnabled).toBe(true);
      expect(await channel?.matchPassword('securepass123')).toBe(true);
      expect(channel?.denyGuests).toBe(true);
      expect(channel?.numberOfPlayers).toBe(10);
    });

    it('should update channel description', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: null,
          channelDescription: 'Updated description',
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 10,
        });

      expect(channelName).toBe('Test Channel');
      expect(channelDescription).toBe('Updated description');
      expect(numberOfPlayers).toBe(10);

      const channel = await Channel.findById(protectedChannelId);
      expect(channel?.channelName).toBe('Test Channel');
      expect(channel?.channelDescription).toBe('Updated description');
      expect(channel?.passwordEnabled).toBe(true);
      expect(await channel?.matchPassword('securepass123')).toBe(true);
      expect(channel?.denyGuests).toBe(true);
      expect(channel?.numberOfPlayers).toBe(10);
    });

    it('should throw error when channel name is longer than 50 characters', async () => {
      await expect(
        Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: 'a'.repeat(51),
          channelDescription: null,
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 10,
        }),
      ).rejects.toThrow();
    });

    it('should throw error when channel description is longer than 2000 characters', async () => {
      await expect(
        Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: null,
          channelDescription: 'a'.repeat(2001),
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 10,
        }),
      ).rejects.toThrow();
    });

    it('should throw error when channel password is shorter than 8 characters', async () => {
      await expect(
        Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: null,
          channelDescription: null,
          passwordEnabled: true,
          password: 'a'.repeat(7),
          denyGuests: true,
          numberOfPlayers: 10,
        }),
      ).rejects.toThrow();
    });

    it('should throw error when channel player limit is less than 5', async () => {
      await expect(
        Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: null,
          channelDescription: null,
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 4,
        }),
      ).rejects.toThrow();
    });

    it('should throw error when channel player limit is less than 5', async () => {
      await expect(
        Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: null,
          channelDescription: null,
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 21,
        }),
      ).rejects.toThrow();
    });

    it('should not update channel settings when user is not admin', async () => {
      await expect(
        Channel.updateChannelSettings({
          userId: nonAdminId,
          channelId: protectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: true,
          password: 'newpass123',
          denyGuests: true,
          numberOfPlayers: 15,
        }),
      ).rejects.toThrow(new AppError(403, errors.PERMISSION_DENIED));
    });

    it('should not update channel settings when channel does not exist', async () => {
      await expect(
        Channel.updateChannelSettings({
          userId: adminId,
          channelId: new mongoose.Types.ObjectId().toString(),
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: true,
          password: 'newpass123',
          denyGuests: true,
          numberOfPlayers: 15,
        }),
      ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
    });

    it('should not update channel settings when password is not enabled', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: false,
          password: 'newpass123',
          denyGuests: true,
          numberOfPlayers: 15,
        });

      expect(channelName).toBe('Updated Channel');
      expect(channelDescription).toBe('Updated description');
      expect(numberOfPlayers).toBe(15);

      const channel = await Channel.findById(protectedChannelId);
      expect(channel?.channelName).toBe('Updated Channel');
      expect(channel?.channelDescription).toBe('Updated description');
      expect(channel?.passwordEnabled).toBe(false);
      expect(channel?.password).toBeNull();
      expect(channel?.denyGuests).toBe(true);
      expect(channel?.numberOfPlayers).toBe(15);
    });

    it('should update channel settings when password is null', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: protectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 15,
        });

      expect(channelName).toBe('Updated Channel');
      expect(channelDescription).toBe('Updated description');
      expect(numberOfPlayers).toBe(15);

      const channel = await Channel.findById(protectedChannelId);
      expect(channel?.channelName).toBe('Updated Channel');
      expect(channel?.channelDescription).toBe('Updated description');
      expect(channel?.passwordEnabled).toBe(true);
      expect(await channel?.matchPassword('securepass123')).toBe(true);
      expect(channel?.denyGuests).toBe(true);
      expect(channel?.numberOfPlayers).toBe(15);
    });

    it('shoule update channel settings when password is null', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: nonprotectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: true,
          password: 'newpass123',
          denyGuests: true,
          numberOfPlayers: 15,
        });

      expect(channelName).toBe('Updated Channel');
      expect(channelDescription).toBe('Updated description');
      expect(numberOfPlayers).toBe(15);

      const channel = await Channel.findById(nonprotectedChannelId);
      expect(channel?.channelName).toBe('Updated Channel');
      expect(channel?.channelDescription).toBe('Updated description');
      expect(channel?.passwordEnabled).toBe(true);
      expect(await channel?.matchPassword('newpass123')).toBe(true);
    });

    it('should update channel settings when password is not enabled', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: nonprotectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: false,
          password: 'newpass123',
          denyGuests: true,
          numberOfPlayers: 15,
        });

      expect(channelName).toBe('Updated Channel');
      expect(channelDescription).toBe('Updated description');
      expect(numberOfPlayers).toBe(15);

      const channel = await Channel.findById(nonprotectedChannelId);
      expect(channel?.channelName).toBe('Updated Channel');
      expect(channel?.channelDescription).toBe('Updated description');
      expect(channel?.passwordEnabled).toBe(false);
      expect(channel?.password).toBeNull();
    });

    it('should update channel settings when password is null', async () => {
      const [channelName, channelDescription, numberOfPlayers] =
        await Channel.updateChannelSettings({
          userId: adminId,
          channelId: nonprotectedChannelId,
          channelName: 'Updated Channel',
          channelDescription: 'Updated description',
          passwordEnabled: true,
          password: null,
          denyGuests: true,
          numberOfPlayers: 15,
        });

      expect(channelName).toBe('Updated Channel');
      expect(channelDescription).toBe('Updated description');
      expect(numberOfPlayers).toBe(15);

      const channel = await Channel.findById(nonprotectedChannelId);
      expect(channel?.channelName).toBe('Updated Channel');
      expect(channel?.channelDescription).toBe('Updated description');
      expect(channel?.passwordEnabled).toBe(false);
      expect(channel?.password).toBeNull();
    });
  });
});
