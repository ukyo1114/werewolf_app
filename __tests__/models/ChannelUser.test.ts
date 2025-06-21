import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import ChannelUser from '../../src/models/ChannelUser';
import User from '../../src/models/User';

describe('ChannelUser Model Test', () => {
  const nonDuplicateUser = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();
  let testUser: any;
  let testChannelUserId: any;

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    // テスト用のユーザーを作成
    testUser = await User.create({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  beforeEach(async () => {
    // 各テスト前にチャンネルユーザーを作成
    const channelUser = await ChannelUser.create({
      channelId: testChannelId,
      userId: testUser._id,
    });
    testChannelUserId = channelUser._id;
    await ChannelUser.createIndexes();
  });

  afterEach(async () => {
    // 各テスト後にチャンネルユーザーを削除
    await ChannelUser.deleteMany({});
  });

  describe('Channel User Creation', () => {
    it('should create a channel user with valid data', async () => {
      const channelUser = await ChannelUser.create({
        channelId: testChannelId,
        userId: nonDuplicateUser,
      });

      expect(channelUser).toBeDefined();
      expect(channelUser.channelId.toString()).toBe(testChannelId);
      expect(channelUser.userId.toString()).toBe(nonDuplicateUser);
    });

    it('should not create channel user with duplicate channel and user', async () => {
      await expect(
        ChannelUser.create({
          channelId: testChannelId,
          userId: testUser._id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Get Channel Users', () => {
    it('should get all users in a channel', async () => {
      const users = await ChannelUser.getChannelUsers(testChannelId);
      expect(users).toHaveLength(1);
      expect(users[0]).toEqual({
        _id: testUser._id,
        userName: 'testuser',
        pic: null,
        isGuest: false,
      });
    });

    it('should return empty array for channel with no users', async () => {
      await ChannelUser.deleteMany({});
      const users = await ChannelUser.getChannelUsers(testChannelId);
      expect(users).toHaveLength(0);
    });
  });

  describe('Check User in Channel', () => {
    it('should return true when user is in channel', async () => {
      const isInChannel = await ChannelUser.isUserInChannel(
        testChannelId,
        testUser._id,
      );
      expect(isInChannel).toBe(true);
    });

    it('should return false when user is not in channel', async () => {
      const isInChannel = await ChannelUser.isUserInChannel(
        testChannelId,
        nonDuplicateUser,
      );
      expect(isInChannel).toBe(false);
    });
  });

  describe('Remove User from Channel', () => {
    it('should successfully remove user from channel', async () => {
      const removed = await ChannelUser.leaveChannel(
        testChannelId,
        testUser._id,
      );
      expect(removed).toBe(true);

      const isInChannel = await ChannelUser.isUserInChannel(
        testChannelId,
        testUser._id,
      );
      expect(isInChannel).toBe(false);
    });

    it('should return false when trying to remove non-existent user from channel', async () => {
      const removed = await ChannelUser.leaveChannel(
        testChannelId,
        nonDuplicateUser,
      );
      expect(removed).toBe(false);
    });
  });
});
