import { IChannel } from '../../models/Channels/ChannelTypes';
import {
  IUpdateChannelSetingsData,
  IJoinChannelData,
} from '../../config/types';

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

export { IJoinChannelData };

export interface IChannelService {
  createChannel(
    userId: string,
    channelData: ICreateChannelData,
  ): Promise<string>;

  joinChannel(
    userId: string,
    channelId: string,
    password?: string,
  ): Promise<IJoinChannelData>;

  leaveChannel(channelId: string, userId: string): Promise<void>;

  deleteChannel(channelId: string, userId: string): Promise<void>;

  getChannelList(userId: string): Promise<IChannelList>;

  updateChannelSettings(
    userId: string,
    channelId: string,
    data: IUpdateChannelSetingsData,
  ): Promise<void>;
}
