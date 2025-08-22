import mongoose, { Schema } from 'mongoose';
import { IChannelUser } from './ChannelUserTypes';

// ChannelUserスキーマの定義
export const ChannelUserSchema = new Schema<IChannelUser>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Users', // UserからUsersに変更
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// 同じチャンネルとユーザーの組み合わせは一意である必要がある
ChannelUserSchema.index({ channelId: 1, userId: 1 }, { unique: true });
