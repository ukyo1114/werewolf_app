import mongoose, { Schema } from 'mongoose';
import { IChannelUser } from './ChannelUserTypes';

export const ChannelUserSchema = new Schema<IChannelUser>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Users',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

ChannelUserSchema.index({ channelId: 1, userId: 1 }, { unique: true });
