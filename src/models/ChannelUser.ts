import mongoose, { Schema, Document, Types } from 'mongoose';

interface IChannelUserModel extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IChannelUser extends mongoose.Model<IChannelUserModel> {
  getChannelUsers(channelId: string): Promise<IChannelUserModel[]>;
  isUserInChannel(channelId: string, userId: string): Promise<boolean>;
  leaveChannel(channelId: string, userId: string): Promise<boolean>;
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
  return this.find({ channelId }).populate('userId', '_iduserName pic');
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

const ChannelUser = mongoose.model<IChannelUserModel, IChannelUser>(
  'ChannelUser',
  ChannelUserSchema,
);

export default ChannelUser;
