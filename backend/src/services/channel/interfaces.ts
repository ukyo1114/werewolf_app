import { IChannel } from '@/models/Channels/ChannelTypes';
import { IChannelParticipant } from '@/models/ChannelUsers/ChannelUserTypes';
import { IUser } from '@/models/Users/UserTypes';

export interface ICreateChannelData {
  channelName: string;
  channelDescription: string;
  passwordEnabled: boolean;
  password?: string;
  channelAdmin: string;
  denyGuests: boolean;
  numberOfPlayers: number;
}

export interface IChannelList {
  channelList: IChannel[];
  participatingChannels: string[];
  blockedChannels: string[];
}

export interface IChannelService {
  createChannel(
    userId: string,
    channelData: ICreateChannelData,
  ): Promise<string>;

  joinChannel(
    userId: string,
    channelId: string,
    password?: string,
  ): Promise<{
    channel: IChannel;
    channelUsers: IChannelParticipant[];
    user: IUser;
  }>;

  leaveChannel(channelId: string, userId: string): Promise<void>;

  deleteChannel(channelId: string, userId: string): Promise<void>;

  getChannelList(userId: string): Promise<IChannelList>;
}
