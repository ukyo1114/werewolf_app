import mongoose from 'mongoose';
import { BlockService } from '../../src/services/block/services';
import Channels from '../../src/models/Channels';
import BlockedUsers from '../../src/models/BlockedUsers';
import ChannelUsers from '../../src/models/ChannelUsers';
import { TransactionHelper } from '../../src/utils/TransactionHelper';

// モックの設定
jest.mock('../../src/models/Channels');
jest.mock('../../src/models/BlockedUsers');
jest.mock('../../src/models/ChannelUsers');
jest.mock('../../src/utils/TransactionHelper');

describe('BlockService', () => {
  let blockService: BlockService;
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockSelectedUser = new mongoose.Types.ObjectId().toString();
  const mockChannelId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    blockService = new BlockService();
    jest.clearAllMocks();
  });

  describe('getBlockedUserList', () => {
    it('ブロックされたユーザーリストを正常に取得する', async () => {
      const mockBlockedUsers = [
        { userId: mockSelectedUser, userName: 'BlockedUser' },
      ];

      (Channels.checkChannelAdmin as jest.Mock).mockResolvedValue(undefined);
      (BlockedUsers.getBlockedUserList as jest.Mock).mockResolvedValue(
        mockBlockedUsers,
      );

      const result = await blockService.getBlockedUserList(
        mockUserId,
        mockChannelId,
      );

      expect(result).toEqual(mockBlockedUsers);
      expect(Channels.checkChannelAdmin).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
      );
      expect(BlockedUsers.getBlockedUserList).toHaveBeenCalledWith(
        mockChannelId,
      );
    });
  });

  describe('registerBlockUser', () => {
    it('ユーザーを正常にブロックする', async () => {
      const mockSession = {} as mongoose.ClientSession;

      (Channels.checkChannelAdmin as jest.Mock).mockResolvedValue(undefined);
      (ChannelUsers.deleteOne as jest.Mock).mockResolvedValue(undefined);
      (BlockedUsers.create as jest.Mock).mockResolvedValue(undefined);

      // TransactionHelperのモック設定
      (TransactionHelper.withTransaction as jest.Mock).mockImplementation(
        async (
          operation: (session: mongoose.ClientSession) => Promise<void>,
        ) => {
          return await operation(mockSession);
        },
      );

      await expect(
        blockService.registerBlockUser(
          mockUserId,
          mockSelectedUser,
          mockChannelId,
        ),
      ).resolves.not.toThrow();

      expect(Channels.checkChannelAdmin).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
      );
      expect(TransactionHelper.withTransaction).toHaveBeenCalled();
      expect(ChannelUsers.deleteOne).toHaveBeenCalledWith(
        { channelId: mockChannelId, userId: mockSelectedUser },
        { session: mockSession },
      );
      expect(BlockedUsers.create).toHaveBeenCalledWith(
        { channelId: mockChannelId, userId: mockSelectedUser },
        { session: mockSession },
      );
    });
  });

  describe('cancelBlock', () => {
    it('ユーザーのブロックを正常に解除する', async () => {
      (Channels.checkChannelAdmin as jest.Mock).mockResolvedValue(undefined);
      (BlockedUsers.deleteOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        blockService.cancelBlock(mockUserId, mockSelectedUser, mockChannelId),
      ).resolves.not.toThrow();

      expect(Channels.checkChannelAdmin).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
      );
      expect(BlockedUsers.deleteOne).toHaveBeenCalledWith({
        channelId: mockChannelId,
        userId: mockSelectedUser,
      });
    });
  });
});
