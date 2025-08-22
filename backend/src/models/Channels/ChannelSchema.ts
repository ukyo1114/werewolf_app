import mongoose, { Schema } from 'mongoose';
import { IChannel } from './ChannelTypes';

// Channelスキーマの定義
export const ChannelSchema = new Schema<IChannel>(
  {
    channelName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    channelDescription: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    passwordEnabled: { type: Boolean, default: false },
    password: {
      type: String,
      required() {
        return this.passwordEnabled;
      },
      minlength: 8,
    },
    channelAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Users',
    },
    denyGuests: {
      type: Boolean,
      default: false,
    },
    numberOfPlayers: {
      type: Number,
      default: 10,
      min: 5,
      max: 20,
    },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// インデックスの作成
ChannelSchema.index({ channelAdmin: 1 }); // admin → channelAdminに修正
