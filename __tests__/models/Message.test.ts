import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import Message from '../../src/models/Message';

describe('Message Model Test', () => {
  const testUserId = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();
  let testMessage: any;

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterEach(async () => {
    await Message.deleteMany({});
  });

  describe('Message Creation', () => {
    it('should create a message with valid data', async () => {
      const message = await Message.create({
        channelId: testChannelId,
        userId: testUserId,
        message: 'Test message',
      });

      expect(message).toBeDefined();
      expect(message.channelId.toString()).toBe(testChannelId);
      expect(message.userId.toString()).toBe(testUserId);
      expect(message.message).toBe('Test message');
      expect(message.messageType).toBe('normal');
      expect(message.createdAt).toBeDefined();
    });

    it('should create a message with werewolf type', async () => {
      const message = await Message.create({
        channelId: testChannelId,
        userId: testUserId,
        message: 'Werewolf message',
        messageType: 'werewolf',
      });

      expect(message.messageType).toBe('werewolf');
    });

    it('should create a message with spectator type', async () => {
      const message = await Message.create({
        channelId: testChannelId,
        userId: testUserId,
        message: 'Spectator message',
        messageType: 'spectator',
      });

      expect(message.messageType).toBe('spectator');
    });

    it('should not create a message with invalid message type', async () => {
      await expect(
        Message.create({
          channelId: testChannelId,
          userId: testUserId,
          message: 'Invalid message',
          messageType: 'invalid',
        }),
      ).rejects.toThrow();
    });

    it('should not create a message with empty message', async () => {
      await expect(
        Message.create({
          channelId: testChannelId,
          userId: testUserId,
          message: '',
        }),
      ).rejects.toThrow();
    });

    it('should not create a message with message longer than 400 characters', async () => {
      const longMessage = 'a'.repeat(401);
      await expect(
        Message.create({
          channelId: testChannelId,
          userId: testUserId,
          message: longMessage,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Message Validation', () => {
    it('should require channelId', async () => {
      await expect(
        Message.create({
          userId: testUserId,
          message: 'Test message',
        }),
      ).rejects.toThrow();
    });

    it('should require userId', async () => {
      await expect(
        Message.create({
          channelId: testChannelId,
          message: 'Test message',
        }),
      ).rejects.toThrow();
    });

    it('should require message', async () => {
      await expect(
        Message.create({
          channelId: testChannelId,
          userId: testUserId,
        }),
      ).rejects.toThrow();
    });
  });
});
