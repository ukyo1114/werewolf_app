import mongoose, { Document, Types } from 'mongoose';

// Channelドキュメントのインターフェース
export interface IChannel extends Document {
  _id: Types.ObjectId;
  channelName: string;
  channelDescription: string;
  passwordEnabled: boolean;
  password: string | undefined;
  channelAdmin: Types.ObjectId;
  denyGuests: boolean;
  numberOfPlayers: number;
  deletedAt: Date | undefined; // ソフトデリートフラグ（削除日時）
  matchPassword(enteredPassword: string): Promise<boolean>;
  softDelete(): Promise<void>;
  update(data: IUpdateChannelSetingsData): Promise<IChannel>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateChannelSetingsData {
  channelName: string;
  channelDescription: string;
  passwordEnabled: boolean;
  password: string;
  denyGuests: boolean;
  numberOfPlayers: number;
}

// Channelモデルの静的メソッドのインターフェース
export interface IChannelStatics extends mongoose.Model<IChannel> {
  getChannelAsAdmin(channelId: string, userId: string): Promise<IChannel>;
  isChannelAdmin(channelId: string, userId: string): Promise<boolean>;
  getChannelList(): Promise<IChannel[]>;
  updateChannelSettings(
    userId: string,
    channelId: string,
    data: IUpdateChannelSetingsData,
  ): Promise<{
    channelName: string;
    channelDescription: string;
    numberOfPlayers: number;
  }>;
  deleteChannel(channelId: string, userId: string): Promise<void>;
}
