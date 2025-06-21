import mongoose, { Schema, Document, Types } from 'mongoose';
import { errors } from '../config/messages';

interface IChannelBlockUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IChannelBlockUserModel extends mongoose.Model<IChannelBlockUser> {
  getBlockedUsers(channelId: string): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  >;
  isUserBlocked(channelId: string, userId: string): Promise<boolean>;
  addBlockUser(channelId: string, userId: string): Promise<boolean>;
  unblockUser(channelId: string, userId: string): Promise<boolean>;
  getBlockedChannels(userId: string): Promise<string[]>;
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
  const blockedUsers = await this.find({ channelId })
    .select('-_id userId')
    .populate('userId', '_id userName pic isGuest')
    .lean();

  return blockedUsers.map(
    (user: {
      userId: {
        _id: Types.ObjectId;
        userName: string;
        pic: string | null;
        isGuest: boolean;
      };
    }) => user.userId,
  );
};

// ユーザーがブロックされているかどうかを確認
ChannelBlockUserSchema.statics.isUserBlocked = async function (
  channelId: string,
  userId: string,
): Promise<boolean> {
  const blockedUser = await this.findOne({ channelId, userId });
  return !!blockedUser;
};

// ユーザーをブロック
ChannelBlockUserSchema.statics.addBlockUser = async function (
  channelId: string,
  userId: string,
): Promise<void> {
  try {
    await this.create({ channelId, userId });
  } catch (error: any) {
    if (error.code === 11000) throw new Error(errors.USER_ALREADY_BLOCKED);
    throw error;
  }
};

// ユーザーのブロックを解除
ChannelBlockUserSchema.statics.unblockUser = async function (
  channelId: string,
  userId: string,
): Promise<boolean> {
  const result = await this.deleteOne({ channelId, userId });
  return result.deletedCount > 0;
};

// ユーザーがブロックされているチャンネル一覧を取得
ChannelBlockUserSchema.statics.getBlockedChannels = async function (
  userId: string,
): Promise<string[]> {
  const channels = await this.find({ userId }).select('-_id channelId').lean();
  return channels.map((channel: { channelId: Types.ObjectId }) =>
    channel.channelId.toString(),
  );
};

const ChannelBlockUser = mongoose.model<
  IChannelBlockUser,
  IChannelBlockUserModel
>('ChannelBlockUser', ChannelBlockUserSchema);

export default ChannelBlockUser;
