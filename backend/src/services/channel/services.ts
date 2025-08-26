import { TransactionHelper } from '@/utils/TransactionHelper';
import Users from '@/models/Users';
import Channels from '@/models/Channels';
import ChannelUsers from '@/models/ChannelUsers';
import BlockedUsers from '@/models/BlockedUsers';
import Messages from '@/models/Messages';
import { IUser } from '@/models/Users/UserTypes';
import { IChannel } from '@/models/Channels/ChannelTypes';
import { IChannelParticipant } from '@/models/ChannelUsers/ChannelUserTypes';
import {
  IChannelList,
  IChannelService,
  ICreateChannelData,
} from './interfaces';
import { errors } from '@/config/messages';

export class ChannelService implements IChannelService {
  async createChannel(
    userId: string,
    channelData: ICreateChannelData,
  ): Promise<string> {
    const isGuest = await Users.isGuest(userId);
    if (isGuest) throw new Error(errors.GUEST_CREATE_CHANNEL_DENIED);

    return TransactionHelper.withTransaction(async (session) => {
      const newChannel = await Channels.create([channelData], { session });
      await ChannelUsers.create(
        [
          {
            channelId: newChannel[0]._id,
            userId,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return newChannel[0]._id.toString();
    });
  }

  async joinChannel(
    userId: string,
    channelId: string,
    password?: string,
  ): Promise<{
    channel: IChannel;
    channelUsers: IChannelParticipant[];
    user: IUser;
  }> {
    const channel = await Channels.findActiveChannelById(channelId);

    await this.authJoinChannel(channel, userId, password);

    const [channelUsers, user] = await Promise.all([
      ChannelUsers.getChannelUsers(channelId),
      Users.findById(userId).select('_id userName pic isGuest').lean(),
    ]);

    return { channel, channelUsers, user: user as IUser };
  }

  async leaveChannel(channelId: string, userId: string): Promise<void> {
    const isChannelAdmin = await Channels.isChannelAdmin(channelId, userId);
    if (isChannelAdmin) throw new Error(errors.ADMIN_LEAVE_DENIED);
    await ChannelUsers.deleteOne({ channelId, userId });
  }

  async deleteChannel(channelId: string, userId: string): Promise<void> {
    return TransactionHelper.withTransaction(async (session) => {
      await ChannelUsers.deleteMany({ channelId }, { session });
      await BlockedUsers.deleteMany({ channelId }, { session });
      await Messages.deleteMany({ channelId }, { session });
      await Channels.deleteChannel(channelId, userId, session);

      await session.commitTransaction();
    });
  }

  async getChannelList(userId: string): Promise<IChannelList> {
    const channelList = await Channels.getChannelList();
    const participatingChannels =
      await ChannelUsers.getParticipantingChannels(userId);
    const blockedChannels = await BlockedUsers.getBlockedChannels(userId);
    return { channelList, participatingChannels, blockedChannels };
  }

  private async authJoinChannel(
    channel: IChannel,
    userId: string,
    password?: string,
  ): Promise<void> {
    const channelId = channel._id.toString();
    const [isGuest, isUserInChannel, isUserBlocked, isPasswordCorrect] =
      await Promise.all([
        Users.isGuest(userId),
        ChannelUsers.isUserInChannel(channelId, userId),
        BlockedUsers.isUserBlocked(channelId, userId),
        password ? channel.matchPassword(password) : false,
      ]);

    if (isUserBlocked) throw new Error(errors.USER_BLOCKED);
    if (!isUserInChannel) {
      if (channel.denyGuests && isGuest)
        throw new Error(errors.GUEST_ENTRY_DENIED);
      if (channel.passwordEnabled && !isPasswordCorrect)
        throw new Error(errors.WRONG_PASSWORD);
      await ChannelUsers.create({ channelId, userId });
    }
  }
}

// デフォルトエクスポート用のインスタンス
export const channelService = new ChannelService();
