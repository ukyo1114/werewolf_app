import { IChannel } from '../../models/Channels/ChannelTypes';

/**
 * チャンネル作成のためのデータインターフェース
 */
export interface ICreateChannelData {
  channelName: string;
  channelDescription: string;
  passwordEnabled: boolean;
  password?: string;
  channelAdmin: string;
  denyGuests: boolean;
  numberOfPlayers: number;
}

/**
 * チャンネル更新のためのデータインターフェース
 */
export interface IUpdateChannelData {
  channelName?: string;
  channelDescription?: string;
  passwordEnabled?: boolean;
  password?: string;
  denyGuests?: boolean;
  numberOfPlayers?: number;
}

/**
 * チャンネルサービスのインターフェース
 */
export interface IChannelService {
  /**
   * チャンネルを作成
   */
  createChannel(channelData: ICreateChannelData): Promise<IChannel>;

  /**
   * チャンネル設定を更新
   */
  updateChannelSettings(
    channelId: string,
    userId: string,
    updateData: IUpdateChannelData,
  ): Promise<IChannel>;

  /**
   * チャンネルを削除
   */
  deleteChannel(channelId: string, userId: string): Promise<boolean>;

  /**
   * チャンネル一覧を取得
   */
  getChannelList(): Promise<IChannel[]>;

  /**
   * チャンネルの詳細を取得
   */
  getChannelById(channelId: string): Promise<IChannel | null>;
}
