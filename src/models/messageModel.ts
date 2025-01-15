import mongoose, { Schema, Document, Types } from 'mongoose';

interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  messageType: 'normal' | 'werewolf' | 'spectator';
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
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
    timestamps: true,
  },
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
