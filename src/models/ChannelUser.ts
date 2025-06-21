import mongoose, { Schema, Document, Types } from 'mongoose';

interface IChannelUserModel extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IChannelUser extends mongoose.Model<IChannelUserModel> {
  getChannelUsers(channelId: string): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: Boolean;
    }[]
  >;
  isUserInChannel(channelId: string, userId: string): Promise<boolean>;
  leaveChannel(channelId: string, userId: string): Promise<boolean>;
  getParticipantingChannels(userId: string): Promise<string[]>;
}

const ChannelUserSchema = new Schema<IChannelUserModel>(
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
ChannelUserSchema.index({ channelId: 1, userId: 1 }, { unique: true });

// チャンネルのユーザー一覧を取得
ChannelUserSchema.statics.getChannelUsers = async function (
  channelId: string,
): Promise<IChannelUserModel[]> {
  const users = await this.find({ channelId })
    .select('-_id userId')
    .populate('userId', '_id userName pic isGuest')
    .lean();

  return users.map(
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

// ユーザーがチャンネルにいるかどうかを確認
ChannelUserSchema.statics.isUserInChannel = async function (
  channelId: string,
  userId: string,
): Promise<boolean> {
  const channelUser = await this.findOne({ channelId, userId });
  return !!channelUser;
};

// ユーザーをチャンネルから削除
ChannelUserSchema.statics.leaveChannel = async function (
  channelId: string,
  userId: string,
): Promise<boolean> {
  const result = await this.deleteOne({ channelId, userId });
  return result.deletedCount > 0;
};

// ユーザーが参加しているチャンネル一覧を取得
ChannelUserSchema.statics.getParticipantingChannels = async function (
  userId: string,
): Promise<string[]> {
  const channels = await this.find({ userId }).select('-_id channelId').lean();
  return channels.map((channel: { channelId: Types.ObjectId }) =>
    channel.channelId.toString(),
  );
};

const ChannelUser = mongoose.model<IChannelUserModel, IChannelUser>(
  'ChannelUser',
  ChannelUserSchema,
);

export default ChannelUser;
