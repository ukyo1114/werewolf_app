import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import ChannelBlockUser from '../../src/models/ChannelBlockUser';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';

describe('ChannelBlockUser Model Test', () => {
  const testAdmin = new ObjectId().toString();
  let testUser: any;
  let testChannel: any;
  let testBlockedUser: any;

  beforeAll(async () => {
    // テスト用のユーザーを作成
    testUser = await User.create({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      isGuest: false,
    });

    // テスト用のチャンネルを作成
    testChannel = await Channel.create({
      channelName: 'test-channel',
      channelDescription: 'Test channel description',
      channelAdmin: testAdmin,
      passwordEnabled: false,
    });
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await User.deleteMany({});
    await Channel.deleteMany({});
    await ChannelBlockUser.deleteMany({});
  });

  beforeEach(async () => {
    // 各テスト前にブロックユーザーを削除
    await ChannelBlockUser.deleteMany({});
  });

  afterEach(async () => {
    // 各テスト後にブロックユーザーを削除
    await ChannelBlockUser.deleteMany({});
  });

  describe('Block User Creation', () => {
    it('should create a blocked user with valid data', async () => {
      const blockedUser = await ChannelBlockUser.create({
        channelId: testChannel._id,
        userId: testUser._id,
      });

      expect(blockedUser).toBeDefined();
      expect(blockedUser.channelId.toString()).toBe(testChannel._id.toString());
      expect(blockedUser.userId.toString()).toBe(testUser._id.toString());
    });

    it('should not create duplicate block entries', async () => {
      // 最初のブロックユーザーを作成
      await ChannelBlockUser.create({
        channelId: testChannel._id,
        userId: testUser._id,
      });

      // 同じユーザーとチャンネルの組み合わせで再度作成を試みる
      await expect(
        ChannelBlockUser.create({
          channelId: testChannel._id,
          userId: testUser._id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Get Blocked Users', () => {
    it('should get all blocked users in a channel', async () => {
      // ブロックユーザーを作成
      await ChannelBlockUser.create({
        channelId: testChannel._id,
        userId: testUser._id,
      });

      const blockedUsers = await ChannelBlockUser.getBlockedUsers(
        testChannel._id,
      );
      expect(blockedUsers).toHaveLength(1);
      expect(blockedUsers[0].userId._id.toString()).toBe(
        testUser._id.toString(),
      );
    });

    it('should return empty array for channel with no blocked users', async () => {
      const blockedUsers = await ChannelBlockUser.getBlockedUsers(
        testChannel._id,
      );
      expect(blockedUsers).toHaveLength(0);
    });
  });

  describe('Check User Block Status', () => {
    it('should return true when user is blocked', async () => {
      // ブロックユーザーを作成
      await ChannelBlockUser.create({
        channelId: testChannel._id,
        userId: testUser._id,
      });

      const isBlocked = await ChannelBlockUser.isUserBlocked(
        testChannel._id,
        testUser._id,
      );
      expect(isBlocked).toBe(true);
    });

    it('should return false when user is not blocked', async () => {
      const newUser = await User.create({
        userName: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        isGuest: false,
      });

      const isBlocked = await ChannelBlockUser.isUserBlocked(
        testChannel._id,
        newUser._id.toString(),
      );
      expect(isBlocked).toBe(false);

      await User.deleteOne({ _id: newUser._id });
    });
  });

  describe('Unblock User', () => {
    it('should successfully unblock user', async () => {
      // ブロックユーザーを作成
      await ChannelBlockUser.create({
        channelId: testChannel._id,
        userId: testUser._id,
      });

      const unblocked = await ChannelBlockUser.unblockUser(
        testChannel._id,
        testUser._id,
      );
      expect(unblocked).toBe(true);

      const isBlocked = await ChannelBlockUser.isUserBlocked(
        testChannel._id,
        testUser._id,
      );
      expect(isBlocked).toBe(false);
    });

    it('should return false when trying to unblock non-blocked user', async () => {
      const newUser = await User.create({
        userName: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        isGuest: false,
      });

      const unblocked = await ChannelBlockUser.unblockUser(
        testChannel._id,
        newUser._id.toString(),
      );
      expect(unblocked).toBe(false);

      await User.deleteOne({ _id: newUser._id });
    });
  });
});
