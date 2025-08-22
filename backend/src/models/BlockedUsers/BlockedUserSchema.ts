import mongoose, { Schema } from 'mongoose';
import { IBlockedUser } from './BlockedUserTypes';

// ChannelBlockUserスキーマの定義
export const BlockedUserSchema = new Schema<IBlockedUser>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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
BlockedUserSchema.index({ channelId: 1, userId: 1 }, { unique: true });
