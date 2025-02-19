import mongoose, { Schema, Document, Types } from 'mongoose';

interface IChannelUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const channelUserSchema = new Schema<IChannelUser>(
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
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// 同じチャンネルとユーザーの組み合わせは一意である必要がある
channelUserSchema.index({ channelId: 1, userId: 1 }, { unique: true });

const ChannelUser = mongoose.model('ChannelUser', channelUserSchema);

export default ChannelUser;
