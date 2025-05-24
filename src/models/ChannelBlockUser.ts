import mongoose, { Schema, Document, Types } from 'mongoose';

interface IChannelBlockUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IChannelBlockUserModel extends mongoose.Model<IChannelBlockUser> {
  getBlockedUsers(channelId: string): Promise<IChannelBlockUser[]>;
  isUserBlocked(channelId: string, userId: string): Promise<boolean>;
  unblockUser(channelId: string, userId: string): Promise<boolean>;
}

const ChannelBlockUserSchema = new Schema<IChannelBlockUser>(
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

ChannelBlockUserSchema.index({ channelId: 1, userId: 1 }, { unique: true });

// チャンネルのブロックユーザー一覧を取得
ChannelBlockUserSchema.statics.getBlockedUsers = async function (
  channelId: string,
): Promise<IChannelBlockUser[]> {
  return this.find({ channelId }).populate('userId', '_id userName pic').lean();
};

// ユーザーがブロックされているかどうかを確認
ChannelBlockUserSchema.statics.isUserBlocked = async function (
  channelId: string,
  userId: string,
): Promise<boolean> {
  const blockedUser = await this.findOne({ channelId, userId });
  return !!blockedUser;
};

// ユーザーのブロックを解除
ChannelBlockUserSchema.statics.unblockUser = async function (
  channelId: string,
  userId: string,
): Promise<boolean> {
  const result = await this.deleteOne({ channelId, userId });
  return result.deletedCount > 0;
};

const ChannelBlockUser = mongoose.model<
  IChannelBlockUser,
  IChannelBlockUserModel
>('ChannelBlockUser', ChannelBlockUserSchema);

export default ChannelBlockUser;
