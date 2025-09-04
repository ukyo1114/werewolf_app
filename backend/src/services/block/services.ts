import Channels from '../../models/Channels';
import BlockedUsers from '../../models/BlockedUsers';
import { IBlockService } from './interfaces';
import { IBlockedUserList } from '../../models/BlockedUsers/BlockedUserTypes';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import ChannelUsers from '../../models/ChannelUsers';
import { Events } from '../../config/appState';

const { channelEvents } = Events;

export class BlockService implements IBlockService {
  async getBlockedUserList(
    userId: string,
    channelId: string,
  ): Promise<IBlockedUserList[]> {
    await Channels.checkChannelAdmin(channelId, userId);
    const blockedUserList = await BlockedUsers.getBlockedUserList(channelId);

    return blockedUserList;
  }

  async registerBlockUser(
    userId: string,
    selectedUser: string,
    channelId: string,
  ): Promise<void> {
    if (userId === selectedUser)
      throw new AppError(400, errors.DENIED_SELF_BLOCK);
    await Channels.checkChannelAdmin(channelId, userId);

    // NOTE: トランザクション検討
    await ChannelUsers.deleteOne({ channelId, userId: selectedUser });
    await BlockedUsers.create({ channelId, userId: selectedUser });

    channelEvents.emit('registerBlock', {
      channelId,
      userId: selectedUser,
    });
  }

  async cancelBlock(
    userId: string,
    selectedUser: string,
    channelId: string,
  ): Promise<void> {
    await Channels.checkChannelAdmin(channelId, userId);
    await BlockedUsers.deleteOne({ channelId, userId: selectedUser });

    channelEvents.emit('cancelBlock', {
      channelId,
      userId: selectedUser,
    });
  }
}

export const blockService = new BlockService();
