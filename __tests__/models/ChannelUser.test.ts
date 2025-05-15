import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import ChannelUser from '../../src/models/ChannelUser';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';

describe('ChannelUser Model Test', () => {
  const testAdmin = new ObjectId().toString();
  const nonDuplicateUser = new ObjectId().toString();
  let testUser: any;
  let testChannel: any;
  let testChannelUser: any;

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
    await ChannelUser.deleteMany({});
    // await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 各テスト前にチャンネルユーザーを作成
    testChannelUser = await ChannelUser.create({
      channelId: testChannel._id,
      userId: testUser._id,
    });
  });

  afterEach(async () => {
    // 各テスト後にチャンネルユーザーを削除
    await ChannelUser.deleteMany({});
  });

  describe('Channel User Creation', () => {
    it('should create a channel user with valid data', async () => {
      const channelUser = await ChannelUser.create({
        channelId: testChannel._id,
        userId: nonDuplicateUser,
      });

      expect(channelUser).toBeDefined();
      expect(channelUser.channelId.toString()).toBe(testChannel._id.toString());
      expect(channelUser.userId.toString()).toBe(nonDuplicateUser);
    });

    it('should not create channel user with duplicate channel and user', async () => {
      await expect(
        ChannelUser.create({
          channelId: testChannel._id,
          userId: testUser._id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Get Channel Users', () => {
    it('should get all users in a channel', async () => {
      const users = await ChannelUser.getChannelUsers(testChannel._id);
      expect(users).toHaveLength(1);
      expect(users[0].userId._id.toString()).toBe(testUser._id.toString());
    });

    it('should return empty array for channel with no users', async () => {
      await ChannelUser.deleteMany({});
      const users = await ChannelUser.getChannelUsers(testChannel._id);
      expect(users).toHaveLength(0);
    });
  });

  describe('Check User in Channel', () => {
    it('should return true when user is in channel', async () => {
      const isInChannel = await ChannelUser.isUserInChannel(
        testChannel._id,
        testUser._id,
      );
      expect(isInChannel).toBe(true);
    });

    it('should return false when user is not in channel', async () => {
      const newUser = await User.create({
        userName: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        isGuest: false,
      });

      const isInChannel = await ChannelUser.isUserInChannel(
        testChannel._id,
        newUser._id,
      );
      expect(isInChannel).toBe(false);

      await User.deleteOne({ _id: newUser._id });
    });
  });

  describe('Remove User from Channel', () => {
    it('should successfully remove user from channel', async () => {
      const removed = await ChannelUser.leaveChannel(
        testChannel._id,
        testUser._id,
      );
      expect(removed).toBe(true);

      const isInChannel = await ChannelUser.isUserInChannel(
        testChannel._id,
        testUser._id,
      );
      expect(isInChannel).toBe(false);
    });

    it('should return false when trying to remove non-existent user from channel', async () => {
      const newUser = await User.create({
        userName: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        isGuest: false,
      });

      const removed = await ChannelUser.leaveChannel(
        testChannel._id,
        newUser._id,
      );
      expect(removed).toBe(false);

      await User.deleteOne({ _id: newUser._id });
    });
  });
});
