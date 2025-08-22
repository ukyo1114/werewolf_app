import mongoose from 'mongoose';
import Channels from '../models/Channels';
import ChannelUsers from '../models/ChannelUsers';
import { IChannel } from '../models/Channels/ChannelTypes';
import {
  IChannelService,
  ICreateChannelData,
  IUpdateChannelData,
} from './interfaces/IChannelService';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

/**
 * チャンネルサービスの実装クラス
 * チャンネル関連のビジネスロジックを担当
 */
export class ChannelService implements IChannelService {
  /**
   * チャンネルを作成
   */
  async createChannel(channelData: ICreateChannelData): Promise<IChannel> {
    const newChannel = await Channels.create(channelData);
    return newChannel;
  }

  /**
   * チャンネル設定を更新
   */
  async updateChannelSettings(
    channelId: string,
    userId: string,
    updateData: IUpdateChannelData,
  ): Promise<IChannel> {
    // 管理者権限チェック
    const isAdmin = await Channels.isChannelAdmin(channelId, userId);
    if (!isAdmin) {
      throw new AppError(403, errors.PERMISSION_DENIED);
    }

    const updatedChannel = await Channels.findByIdAndUpdate(
      channelId,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedChannel) {
      throw new AppError(404, errors.CHANNEL_NOT_FOUND);
    }

    return updatedChannel;
  }

  /**
   * チャンネルを削除
   */
  async deleteChannel(channelId: string, userId: string): Promise<boolean> {
    // 管理者権限チェック
    const isAdmin = await Channels.isChannelAdmin(channelId, userId);
    if (!isAdmin) {
      throw new AppError(403, errors.PERMISSION_DENIED);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. チャンネルユーザーを削除
      await ChannelUsers.deleteMany({ channelId }, { session });

      // 2. チャンネルを削除
      await Channels.deleteOne({ _id: channelId }, { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * チャンネル一覧を取得
   */
  async getChannelList(): Promise<IChannel[]> {
    return await Channels.getChannelList();
  }

  /**
   * チャンネルの詳細を取得
   */
  async getChannelById(channelId: string): Promise<IChannel | null> {
    return await Channels.findById(channelId);
  }
}

// デフォルトエクスポート用のインスタンス
export const channelService = new ChannelService();
