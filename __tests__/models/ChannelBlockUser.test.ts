import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import ChannelBlockUser from '../../src/models/ChannelBlockUser';
import User from '../../src/models/User';
import { errors } from '../../src/config/messages';

describe('ChannelBlockUser Model Test', () => {
  const testChannelId = new ObjectId().toString();
  const nonBlockedUserId = new ObjectId().toString();
  let testUser: any;

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    testUser = await User.create({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  beforeEach(async () => {
    await ChannelBlockUser.create({
      channelId: testChannelId,
      userId: testUser._id,
    });
    await ChannelBlockUser.createIndexes();
  });

  afterEach(async () => {
    await ChannelBlockUser.deleteMany({});
  });

  describe('Block User Creation', () => {
    it('should create a blocked user with valid data', async () => {
      const blockedUser = await ChannelBlockUser.create({
        channelId: testChannelId,
        userId: nonBlockedUserId,
      });

      expect(blockedUser).toBeDefined();
      expect(blockedUser.channelId.toString()).toBe(testChannelId);
      expect(blockedUser.userId.toString()).toBe(nonBlockedUserId);
    });

    it('should not create duplicate block entries', async () => {
      await expect(
        ChannelBlockUser.create({
          channelId: testChannelId,
          userId: testUser._id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Get Blocked Users', () => {
    it('should get all blocked users in a channel', async () => {
      const blockedUsers =
        await ChannelBlockUser.getBlockedUsers(testChannelId);
      expect(blockedUsers).toHaveLength(1);
      expect(blockedUsers[0]).toEqual({
        _id: testUser._id,
        userName: 'testuser',
        pic: null,
        isGuest: false,
      });
    });

    it('should return empty array for channel with no blocked users', async () => {
      await ChannelBlockUser.deleteMany({});
      const blockedUsers =
        await ChannelBlockUser.getBlockedUsers(testChannelId);
      expect(blockedUsers).toHaveLength(0);
    });
  });

  describe('Check User Block Status', () => {
    it('should return true when user is blocked', async () => {
      const isBlocked = await ChannelBlockUser.isUserBlocked(
        testChannelId,
        testUser._id,
      );
      expect(isBlocked).toBe(true);
    });

    it('should return false when user is not blocked', async () => {
      const isBlocked = await ChannelBlockUser.isUserBlocked(
        testChannelId,
        nonBlockedUserId,
      );
      expect(isBlocked).toBe(false);
    });
  });

  describe('test addBlockUser', () => {
    it('should add a blocked user to the channel', async () => {
      await ChannelBlockUser.addBlockUser(testChannelId, nonBlockedUserId);
      const isBlocked = await ChannelBlockUser.findOne({
        channelId: testChannelId,
        userId: nonBlockedUserId,
      });
      expect(isBlocked).toBeDefined();
    });

    it('should not add a duplicate block entry', async () => {
      await expect(
        ChannelBlockUser.addBlockUser(testChannelId, testUser._id),
      ).rejects.toThrow(errors.USER_ALREADY_BLOCKED);
    });
  });

  describe('Unblock User', () => {
    it('should successfully unblock user', async () => {
      const unblocked = await ChannelBlockUser.unblockUser(
        testChannelId,
        testUser._id,
      );
      expect(unblocked).toBe(true);

      const isBlocked = await ChannelBlockUser.isUserBlocked(
        testChannelId,
        testUser._id,
      );
      expect(isBlocked).toBe(false);
    });

    it('should return false when trying to unblock non-blocked user', async () => {
      const unblocked = await ChannelBlockUser.unblockUser(
        testChannelId,
        nonBlockedUserId,
      );
      expect(unblocked).toBe(false);
    });
  });
});
