import Users from '../../models/Users';
import Channels from '../../models/Channels';
import ChannelUsers from '../../models/ChannelUsers';
import BlockedUsers from '../../models/BlockedUsers';
import Messages from '../../models/Messages';
import { IChannel } from '../../models/Channels/ChannelTypes';
import {
  IChannelList,
  IChannelService,
  ICreateChannelData,
  IJoinChannelData,
} from './interfaces';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { IUpdateChannelSetingsData } from '../../config/types';
import { appState, Events } from '../../config/appState';
import ChannelManager from '../../classes/ChannelManager';
import EntryManager from '../../classes/EntryManager';

const { channelManagers, entryManagers } = appState;
const { channelEvents, entryEvents } = Events;

export class ChannelService implements IChannelService {
  async createChannel(
    userId: string,
    channelData: ICreateChannelData,
  ): Promise<string> {
    const isGuest = await Users.isGuest(userId);
    if (isGuest) throw new AppError(400, errors.GUEST_CREATE_CHANNEL_DENIED);

    // NOTE: トランザクション検討
    const newChannel = await Channels.create(channelData);
    const newChannelId = newChannel._id.toString();
    await ChannelUsers.create({ channelId: newChannelId, userId });

    channelManagers[newChannelId] = new ChannelManager(newChannelId);
    entryManagers[newChannelId] = new EntryManager(
      newChannelId,
      channelData.numberOfPlayers,
    );
    return newChannelId;
  }

  async joinChannel(
    userId: string,
    channelId: string,
    password?: string,
  ): Promise<IJoinChannelData> {
    const channel = await Channels.findActiveChannelById(channelId);

    await this.authJoinChannel(channel, userId, password);

    const [channelUsers, user] = await Promise.all([
      ChannelUsers.getChannelUsers(channelId),
      Users.findById(userId).select('_id userName pic isGuest').lean(),
    ]);

    channelEvents.emit('userJoined', { channelId, user });

    return {
      channelName: channel.channelName,
      channelDescription: channel.channelDescription,
      channelAdmin: channel.channelAdmin.toString(),
      numberOfPlayers: channel.numberOfPlayers,
      channelUsers,
    };
  }

  async leaveChannel(channelId: string, userId: string): Promise<void> {
    const isChannelAdmin = await Channels.isChannelAdmin(channelId, userId);
    if (isChannelAdmin) throw new AppError(400, errors.ADMIN_LEAVE_DENIED);
    await ChannelUsers.deleteOne({ channelId, userId });

    channelEvents.emit('userLeft', { channelId, userId });
  }

  async deleteChannel(channelId: string, userId: string): Promise<void> {
    await Channels.checkChannelAdmin(channelId, userId);

    // NOTE: トランザクション検討
    await Promise.all([
      ChannelUsers.deleteMany({ channelId }),
      BlockedUsers.deleteMany({ channelId }),
      Messages.deleteMany({ channelId }),
      Channels.deleteChannel(channelId, userId),
    ]);

    channelEvents.emit('channelDeleted', channelId);
    entryEvents.emit('channelDeleted', channelId);
    delete channelManagers[channelId];
    delete entryManagers[channelId];
  }

  async getChannelList(userId: string): Promise<IChannelList> {
    const [channelList, participatingChannels, blockedChannels] =
      await Promise.all([
        Channels.getChannelList(),
        ChannelUsers.getParticipantingChannels(userId),
        BlockedUsers.getBlockedChannels(userId),
      ]);

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

    if (isUserBlocked) throw new AppError(400, errors.USER_BLOCKED);
    if (!isUserInChannel) {
      if (channel.denyGuests && isGuest)
        throw new AppError(400, errors.GUEST_ENTRY_DENIED);
      if (channel.passwordEnabled && !isPasswordCorrect)
        throw new AppError(400, errors.WRONG_PASSWORD);
      await ChannelUsers.create({ channelId, userId });
    }
  }

  async updateChannelSettings(
    userId: string,
    channelId: string,
    data: IUpdateChannelSetingsData,
  ): Promise<void> {
    const result = await Channels.updateChannelSettings(
      userId,
      channelId,
      data,
    );

    const entryManager = entryManagers[channelId];
    if (entryManager) entryManager.MAX_USERS = data.numberOfPlayers;
    channelEvents.emit('channelSettingsUpdated', { channelId, ...result });
  }
}

export const channelService = new ChannelService();
