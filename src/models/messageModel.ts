import mongoose, { Schema, Document, Types } from 'mongoose';
import { MessageType } from '../config/types';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  messageType: MessageType;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
      maxlength: 400,
    },
    messageType: {
      type: String,
      required: true,
      enum: ['normal', 'werewolf', 'spectator'],
      default: 'normal',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

messageSchema.index({ channelId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
