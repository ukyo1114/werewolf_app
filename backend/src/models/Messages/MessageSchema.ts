import mongoose, { Schema } from 'mongoose';
import { IMessage } from './MessageTypes';

export const MessageSchema = new Schema<IMessage>(
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
    message: {
      type: String,
      required: true,
      maxlength: 400,
    },
    messageType: {
      type: String,
      required: true,
      enum: ['normal', 'werewolf', 'spectator', 'freemason', 'system'],
      default: 'normal',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Messages',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

MessageSchema.index({ channelId: 1, createdAt: -1 });
