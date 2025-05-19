import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import ChannelBlockUser from '../../src/models/ChannelBlockUser';
import User from '../../src/models/User';

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

  afterEach(async () => {
    // 各テスト後にブロックユーザーを削除
    await ChannelBlockUser.deleteMany({});
  });

  describe('Block User Creation', () => {
    it('should create a blocked user with valid data', async () => {
      const blockedUser = await ChannelBlockUser.create({
        channelId: testChannelId,
        userId: testUser._id,
      });

      expect(blockedUser).toBeDefined();
      expect(blockedUser.channelId.toString()).toBe(testChannelId);
      expect(blockedUser.userId.toString()).toBe(testUser._id.toString());
    });

    it('should not create duplicate block entries', async () => {
      await ChannelBlockUser.create({
        channelId: testChannelId,
        userId: testUser._id,
      });

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
      await ChannelBlockUser.create({
        channelId: testChannelId,
        userId: testUser._id,
      });

      const blockedUsers =
        await ChannelBlockUser.getBlockedUsers(testChannelId);
      expect(blockedUsers).toHaveLength(1);
      expect(blockedUsers[0].userId._id.toString()).toBe(
        testUser._id.toString(),
      );
      expect(blockedUsers[0].userId).toHaveProperty('userName');
      expect(blockedUsers[0].userId).toHaveProperty('pic');
    });

    it('should return empty array for channel with no blocked users', async () => {
      const blockedUsers =
        await ChannelBlockUser.getBlockedUsers(testChannelId);
      expect(blockedUsers).toHaveLength(0);
    });
  });

  describe('Check User Block Status', () => {
    it('should return true when user is blocked', async () => {
      // ブロックユーザーを作成
      await ChannelBlockUser.create({
        channelId: testChannelId,
        userId: testUser._id,
      });

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

  describe('Unblock User', () => {
    it('should successfully unblock user', async () => {
      await ChannelBlockUser.create({
        channelId: testChannelId,
        userId: testUser._id,
      });

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
