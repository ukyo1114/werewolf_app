import mongoose from 'mongoose';
import { MessageService } from '../../src/services/message/services';
import Messages from '../../src/models/Messages';

// モックの設定
jest.mock('../../src/models/Messages');
jest.mock('../../src/config/appState', () => ({
  appState: {
    channelManagers: {
      mockChannelId: {
        getReceiveMessageType: jest.fn().mockReturnValue(['text']),
        getSendMessageType: jest.fn().mockReturnValue('text'),
        getMessageReceivers: jest.fn().mockReturnValue(['userId1', 'userId2']),
      },
    },
  },
  Events: {
    channelEvents: {
      emit: jest.fn(),
    },
  },
}));

describe('MessageService', () => {
  let messageService: MessageService;
  const mockChannelId = 'mockChannelId';
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockIndex = ['index1', 'index2'];

  beforeEach(() => {
    messageService = new MessageService();
    jest.clearAllMocks();
  });

  describe('getIndex', () => {
    it('メッセージインデックスを正常に取得する', async () => {
      const mockIndexResult = [{ id: '1', timestamp: new Date() }];
      (Messages.getIndex as jest.Mock).mockResolvedValue(mockIndexResult);

      const result = await messageService.getIndex(mockChannelId, mockUserId);

      expect(result).toEqual(mockIndexResult);
      expect(Messages.getIndex).toHaveBeenCalledWith(mockChannelId, 3000, [
        'text',
      ]);
    });
  });

  describe('getMessages', () => {
    it('メッセージを正常に取得する', async () => {
      const mockMessages = [{ id: '1', message: 'Hello' }];
      (Messages.getMessages as jest.Mock).mockResolvedValue(mockMessages);

      const result = await messageService.getMessages(
        mockChannelId,
        mockUserId,
        mockIndex,
      );

      expect(result).toEqual(mockMessages);
      expect(Messages.getMessages).toHaveBeenCalledWith(
        mockChannelId,
        mockIndex,
        ['text'],
      );
    });
  });

  describe('sendMessage', () => {
    it('メッセージを正常に送信する', async () => {
      const mockMessage = 'Hello World';
      const mockIndexResult = [{ id: '1', timestamp: new Date() }];
      (Messages.create as jest.Mock).mockResolvedValue(undefined);
      (Messages.getIndex as jest.Mock).mockResolvedValue(mockIndexResult);

      await expect(
        messageService.sendMessage(mockChannelId, mockUserId, mockMessage),
      ).resolves.not.toThrow();

      expect(Messages.create).toHaveBeenCalledWith({
        channelId: mockChannelId,
        userId: mockUserId,
        message: mockMessage,
        messageType: 'text',
        replyTo: undefined,
      });
      expect(Messages.getIndex).toHaveBeenCalledWith(mockChannelId, 10, [
        'text',
      ]);
    });

    it('リプライ付きメッセージを正常に送信する', async () => {
      const mockMessage = 'Reply message';
      const mockReplyTo = 'replyId123';
      const mockIndexResult = [{ id: '1', timestamp: new Date() }];
      (Messages.create as jest.Mock).mockResolvedValue(undefined);
      (Messages.getIndex as jest.Mock).mockResolvedValue(mockIndexResult);

      await expect(
        messageService.sendMessage(
          mockChannelId,
          mockUserId,
          mockMessage,
          mockReplyTo,
        ),
      ).resolves.not.toThrow();

      expect(Messages.create).toHaveBeenCalledWith({
        channelId: mockChannelId,
        userId: mockUserId,
        message: mockMessage,
        messageType: 'text',
        replyTo: mockReplyTo,
      });
    });
  });
});
