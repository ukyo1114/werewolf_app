import mongoose, { Schema, Document, Types } from 'mongoose';

interface IChannelBlockUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const channelBlockUserSchema = new Schema<IChannelBlockUser>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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

channelBlockUserSchema.index({ channelId: 1, userId: 1 }, { unique: true });

const ChannelBlockUser = mongoose.model(
  'ChannelBlockUser',
  channelBlockUserSchema,
);

export default ChannelBlockUser;
