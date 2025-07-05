import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import Message from '../../src/models/Message';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';

describe('Message Model Test', () => {
  const testUserId = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();

  beforeEach(async () => {
    await Message.deleteMany();
  });

  describe('Message Creation', () => {
    it('should create a message with valid data', async () => {
      const createdMessageId = new ObjectId().toString();
      const message = await Message.create({
        _id: createdMessageId,
        channelId: testChannelId,
        userId: testUserId,
        message: 'Test message',
      });

      expect(message.toObject()).toEqual({
        __v: 0,
        _id: new ObjectId(createdMessageId),
        channelId: new ObjectId(testChannelId),
        userId: new ObjectId(testUserId),
        message: 'Test message',
        messageType: 'normal',
        createdAt: expect.any(Date),
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

  describe('test getMessagges', () => {
    const messages: Record<string, string> = {};
    const werewolfMessageId = new ObjectId().toString();
    const spectatorMessageId = new ObjectId().toString();

    beforeEach(async () => {
      await Message.create({
        _id: werewolfMessageId,
        channelId: testChannelId,
        userId: testUserId,
        message: 'Werewolf message',
        messageType: 'werewolf',
      });
      await Message.create({
        _id: spectatorMessageId,
        channelId: testChannelId,
        userId: testUserId,
        message: 'Spectator message',
        messageType: 'spectator',
      });
      for (let i = 0; i < 100; i++) {
        messages[`message${i}`] = new ObjectId().toString();
        await Message.create({
          _id: messages[`message${i}`],
          channelId: testChannelId,
          userId: testUserId,
          message: `Message ${i}`,
        });
      }
    });

    it('should get messages in descending order', async () => {
      const fetchedMessages = await Message.getMessages({
        channelId: testChannelId,
        messageType: ['normal'],
      });

      expect(fetchedMessages.length).toBe(50);
      expect(fetchedMessages[0].message).toBe('Message 99');
      expect(fetchedMessages[49].message).toBe('Message 50');
      expect(fetchedMessages[0]).toEqual({
        _id: new ObjectId(messages['message99']),
        channelId: new ObjectId(testChannelId),
        userId: new ObjectId(testUserId),
        message: 'Message 99',
        messageType: 'normal',
        createdAt: expect.any(Date),
      });
    });

    it('shoult throw error if messageId is not found', async () => {
      const notFoundMessageId = new ObjectId().toString();
      await expect(
        Message.getMessages({
          channelId: testChannelId,
          messageId: notFoundMessageId,
        }),
      ).rejects.toThrow(new AppError(404, errors.MESSAGE_NOT_FOUND));
    });

    it('should get messages in descending order', async () => {
      const fetchedMessages = await Message.getMessages({
        channelId: testChannelId,
        messageId: messages['message99'],
        messageType: ['normal'],
      });

      expect(fetchedMessages.length).toBe(50);
      expect(fetchedMessages[0].message).toBe('Message 98');
      expect(fetchedMessages[49].message).toBe('Message 49');
    });

    it('should get messages in descending order', async () => {
      const fetchedMessages = await Message.getMessages({
        channelId: testChannelId,
        messageId: messages['message1'],
        messageType: ['normal'],
      });

      expect(fetchedMessages.length).toBe(1);
      expect(fetchedMessages[0].message).toBe('Message 0');
    });

    it('should filter messages by messageType', async () => {
      const normalMessages = await Message.getMessages({
        channelId: testChannelId,
        messageType: ['normal'],
      });

      expect(normalMessages.length).toBe(50);
      expect(normalMessages[0].messageType).toBe('normal');

      const werewolfMessages = await Message.getMessages({
        channelId: testChannelId,
        messageType: ['werewolf'],
      });

      expect(werewolfMessages.length).toBe(1);
      expect(werewolfMessages[0].messageType).toBe('werewolf');
    });

    it('should respect limit parameter', async () => {
      const fetchedMessages = await Message.getMessages({
        channelId: testChannelId,
        messageType: null,
        limit: 10,
      });

      expect(fetchedMessages.length).toBe(10);
      expect(fetchedMessages[0].message).toBe('Message 99');
      expect(fetchedMessages[9].message).toBe('Message 90');
    });

    it('should handle multiple message types', async () => {
      const fetchedMessages = await Message.getMessages({
        channelId: testChannelId,
        messageId: messages['message1'],
        messageType: ['normal', 'werewolf'],
      });

      expect(fetchedMessages.length).toBe(2);
      expect(fetchedMessages.map((m) => m.messageType).sort()).toEqual([
        'normal',
        'werewolf',
      ]);
    });
  });
});
