import { EventEmitter } from 'events';

// モックの設定
jest.mock('../../src/models/Users');
jest.mock('../../src/models/Channels');
jest.mock('../../src/models/ChannelUsers');
jest.mock('../../src/models/BlockedUsers');
jest.mock('../../src/models/Messages');
jest.mock('../../src/utils/TransactionHelper');
jest.mock('../../src/classes/ChannelManager');
jest.mock('../../src/classes/EntryManager');
jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
    entryManagers: {},
  },
  Events: {
    entryEvents: new EventEmitter(),
    channelEvents: new EventEmitter(),
  },
}));

import mongoose from 'mongoose';
import { ChannelService } from '../../src/services/channel/services';
import Users from '../../src/models/Users';
import Channels from '../../src/models/Channels';
import ChannelUsers from '../../src/models/ChannelUsers';
import BlockedUsers from '../../src/models/BlockedUsers';
import Messages from '../../src/models/Messages';

describe('ChannelService', () => {
  let channelService: ChannelService;
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockChannelId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    channelService = new ChannelService();
    jest.clearAllMocks();
  });

  describe('createChannel', () => {
    it('チャンネルを正常に作成する', async () => {
      const mockChannelData = {
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        numberOfPlayers: 8,
        passwordEnabled: false,
        denyGuests: false,
        channelAdmin: mockUserId,
      };
      const mockNewChannel = { _id: mockChannelId };

      (Users.isGuest as jest.Mock).mockResolvedValue(false);
      (Channels.create as jest.Mock).mockResolvedValue(mockNewChannel);
      (ChannelUsers.create as jest.Mock).mockResolvedValue(undefined);

      const result = await channelService.createChannel(
        mockUserId,
        mockChannelData,
      );

      expect(result).toBe(mockChannelId);
      expect(Users.isGuest).toHaveBeenCalledWith(mockUserId);
      expect(Channels.create).toHaveBeenCalledWith(mockChannelData);
      expect(ChannelUsers.create).toHaveBeenCalledWith({
        channelId: mockChannelId,
        userId: mockUserId,
      });
    });
  });

  describe('joinChannel', () => {
    it('チャンネルに正常に参加する', async () => {
      const mockChannel = {
        _id: mockChannelId,
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        numberOfPlayers: 8,
        denyGuests: false,
        passwordEnabled: false,
        matchPassword: jest.fn().mockReturnValue(true),
        channelAdmin: mockAdminId,
      };
      const mockChannelUsers = [{ userId: mockUserId, userName: 'TestUser' }];
      const mockUser = {
        _id: mockUserId,
        userName: 'TestUser',
        pic: 'pic.jpg',
        isGuest: false,
      };

      (Channels.findActiveChannelById as jest.Mock).mockResolvedValue(
        mockChannel,
      );
      (Users.isGuest as jest.Mock).mockResolvedValue(false);
      (ChannelUsers.isUserInChannel as jest.Mock).mockResolvedValue(false);
      (BlockedUsers.isUserBlocked as jest.Mock).mockResolvedValue(false);
      (ChannelUsers.getChannelUsers as jest.Mock).mockResolvedValue(
        mockChannelUsers,
      );
      (Users.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await channelService.joinChannel(
        mockUserId,
        mockChannelId,
      );

      expect(result).toEqual({
        channelName: mockChannel.channelName,
        channelDescription: mockChannel.channelDescription,
        channelAdmin: mockChannel.channelAdmin.toString(),
        numberOfPlayers: mockChannel.numberOfPlayers,
        channelUsers: mockChannelUsers,
      });
      expect(Channels.findActiveChannelById).toHaveBeenCalledWith(
        mockChannelId,
      );
      expect(ChannelUsers.create).toHaveBeenCalledWith({
        channelId: mockChannelId,
        userId: mockUserId,
      });
    });
  });

  describe('getChannelList', () => {
    it('チャンネルリストを正常に取得する', async () => {
      const mockChannelList = [
        { _id: mockChannelId, channelName: 'Test Channel' },
      ];
      const mockParticipatingChannels = [mockChannelId];
      const mockBlockedChannels: string[] = [];

      (Channels.getChannelList as jest.Mock).mockResolvedValue(mockChannelList);
      (ChannelUsers.getParticipantingChannels as jest.Mock).mockResolvedValue(
        mockParticipatingChannels,
      );
      (BlockedUsers.getBlockedChannels as jest.Mock).mockResolvedValue(
        mockBlockedChannels,
      );

      const result = await channelService.getChannelList(mockUserId);

      expect(result).toEqual({
        channelList: mockChannelList,
        participatingChannels: mockParticipatingChannels,
        blockedChannels: mockBlockedChannels,
      });
      expect(Channels.getChannelList).toHaveBeenCalled();
      expect(ChannelUsers.getParticipantingChannels).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(BlockedUsers.getBlockedChannels).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('leaveChannel', () => {
    it('チャンネルから正常に退出する', async () => {
      (Channels.isChannelAdmin as jest.Mock).mockResolvedValue(false);
      (ChannelUsers.deleteOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        channelService.leaveChannel(mockChannelId, mockUserId),
      ).resolves.not.toThrow();

      expect(Channels.isChannelAdmin).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
      );
      expect(ChannelUsers.deleteOne).toHaveBeenCalledWith({
        channelId: mockChannelId,
        userId: mockUserId,
      });
    });
  });

  describe('deleteChannel', () => {
    it('チャンネルを正常に削除する', async () => {
      (Channels.checkChannelAdmin as jest.Mock).mockResolvedValue(undefined);
      (ChannelUsers.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (BlockedUsers.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (Messages.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (Channels.deleteChannel as jest.Mock).mockResolvedValue(undefined);

      await expect(
        channelService.deleteChannel(mockChannelId, mockUserId),
      ).resolves.not.toThrow();

      expect(Channels.checkChannelAdmin).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
      );
      expect(ChannelUsers.deleteMany).toHaveBeenCalledWith({
        channelId: mockChannelId,
      });
      expect(BlockedUsers.deleteMany).toHaveBeenCalledWith({
        channelId: mockChannelId,
      });
      expect(Messages.deleteMany).toHaveBeenCalledWith({
        channelId: mockChannelId,
      });
      expect(Channels.deleteChannel).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
      );
    });
  });

  describe('updateChannelSettings', () => {
    it('チャンネル設定を正常に更新する', async () => {
      const mockUpdateData = {
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        password: 'Test Password',
        passwordEnabled: true,
        denyGuests: false,
        numberOfPlayers: 10,
      };
      const mockUpdateResult = { numberOfPlayers: 10 };

      (Channels.updateChannelSettings as jest.Mock).mockResolvedValue(
        mockUpdateResult,
      );

      await expect(
        channelService.updateChannelSettings(
          mockUserId,
          mockChannelId,
          mockUpdateData,
        ),
      ).resolves.not.toThrow();

      expect(Channels.updateChannelSettings).toHaveBeenCalledWith(
        mockUserId,
        mockChannelId,
        mockUpdateData,
      );
    });
  });
});
