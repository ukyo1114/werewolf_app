import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import Message from '../../src/models/Message';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';

describe('Message Model Test', () => {
  const testAdmin = new ObjectId().toString();
  let testUser: any;
  let testChannel: any;
  let testMessage: any;

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
    await Message.deleteMany({});
  });

  beforeEach(async () => {
    // 各テスト前にメッセージを削除
    await Message.deleteMany({});
  });

  afterEach(async () => {
    // 各テスト後にメッセージを削除
    await Message.deleteMany({});
  });

  describe('Message Creation', () => {
    it('should create a message with valid data', async () => {
      const message = await Message.create({
        channelId: testChannel._id,
        userId: testUser._id,
        message: 'Test message',
        messageType: 'normal',
      });

      expect(message).toBeDefined();
      expect(message.channelId.toString()).toBe(testChannel._id.toString());
      expect(message.userId.toString()).toBe(testUser._id.toString());
      expect(message.message).toBe('Test message');
      expect(message.messageType).toBe('normal');
    });

    it('should set default messageType to normal when not specified', async () => {
      const message = await Message.create({
        channelId: testChannel._id,
        userId: testUser._id,
        message: 'Test message',
      });

      expect(message.messageType).toBe('normal');
    });

    it('should create a message with werewolf type', async () => {
      const message = await Message.create({
        channelId: testChannel._id,
        userId: testUser._id,
        message: 'Werewolf message',
        messageType: 'werewolf',
      });

      expect(message.messageType).toBe('werewolf');
    });

    it('should create a message with spectator type', async () => {
      const message = await Message.create({
        channelId: testChannel._id,
        userId: testUser._id,
        message: 'Spectator message',
        messageType: 'spectator',
      });

      expect(message.messageType).toBe('spectator');
    });

    it('should not create a message with invalid message type', async () => {
      await expect(
        Message.create({
          channelId: testChannel._id,
          userId: testUser._id,
          message: 'Invalid message',
          messageType: 'invalid',
        }),
      ).rejects.toThrow();
    });

    it('should not create a message with empty message', async () => {
      await expect(
        Message.create({
          channelId: testChannel._id,
          userId: testUser._id,
          message: '',
          messageType: 'normal',
        }),
      ).rejects.toThrow();
    });

    it('should not create a message with message longer than 400 characters', async () => {
      const longMessage = 'a'.repeat(401);
      await expect(
        Message.create({
          channelId: testChannel._id,
          userId: testUser._id,
          message: longMessage,
          messageType: 'normal',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Message Validation', () => {
    it('should require channelId', async () => {
      await expect(
        Message.create({
          userId: testUser._id,
          message: 'Test message',
          messageType: 'normal',
        }),
      ).rejects.toThrow();
    });

    it('should require userId', async () => {
      await expect(
        Message.create({
          channelId: testChannel._id,
          message: 'Test message',
          messageType: 'normal',
        }),
      ).rejects.toThrow();
    });

    it('should require message', async () => {
      await expect(
        Message.create({
          channelId: testChannel._id,
          userId: testUser._id,
          messageType: 'normal',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Message Timestamps', () => {
    it('should have createdAt timestamp', async () => {
      const message = await Message.create({
        channelId: testChannel._id,
        userId: testUser._id,
        message: 'Test message',
        messageType: 'normal',
      });

      expect(message.createdAt).toBeDefined();
    });
  });
});
