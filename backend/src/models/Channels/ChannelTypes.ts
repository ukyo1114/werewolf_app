import mongoose, { ClientSession, Document, Types } from 'mongoose';
import { IUpdateChannelSetingsData } from '@/config/types';

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
  update(data: IUpdateChannelSetingsData): Promise<IChannel>;
  createdAt: Date;
  updatedAt: Date;
}

// Channelモデルの静的メソッドのインターフェース
export interface IChannelStatics extends mongoose.Model<IChannel> {
  findActiveChannelById(channelId: string): Promise<IChannel>;
  getChannelAsAdmin(channelId: string, userId: string): Promise<IChannel>;
  isChannelAdmin(channelId: string, userId: string): Promise<boolean>;
  checkChannelAdmin(channelId: string, userId: string): Promise<void>;
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
  deleteChannel(
    channelId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<void>;
}

export type { IUpdateChannelSetingsData };
