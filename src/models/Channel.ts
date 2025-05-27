import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

interface IChannel extends Document {
  _id: Types.ObjectId;
  channelName: string;
  channelDescription: string;
  passwordEnabled: boolean;
  password: string | null;
  channelAdmin: Types.ObjectId;
  denyGuests: boolean;
  numberOfPlayers: number;
  matchPassword(enteredPassword: string): Promise<boolean>;
  isModified: (path: string) => boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IChannelModel extends mongoose.Model<IChannel> {
  isChannelAdmin(channelId: string, userId: string): Promise<boolean>;
  getChannelList(): Promise<IChannel[]>;
  updateChannelSettings({
    userId,
    channelId,
    channelName,
    channelDescription,
    passwordEnabled,
    password,
    denyGuests,
    numberOfPlayers,
  }: {
    userId: string;
    channelId: string;
    channelName: string | null;
    channelDescription: string | null;
    passwordEnabled: boolean;
    password: string | null;
    denyGuests: boolean;
    numberOfPlayers: number;
  }): Promise<[string, string, number]>;
}

const ChannelSchema = new Schema<IChannel>(
  {
    channelName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    channelDescription: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    passwordEnabled: { type: Boolean, default: false, required: true },
    password: {
      type: String,
      required() {
        return this.passwordEnabled;
      },
      minlength: 8,
      default: null,
    },
    channelAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    denyGuests: {
      type: Boolean,
      default: false,
      requierd: true,
    },
    numberOfPlayers: {
      type: Number,
      required: true,
      default: 10,
      min: 5,
      max: 20,
    },
  },
  {
    timestamps: true,
  },
);

// パスワードの照合
ChannelSchema.methods.matchPassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// チャンネルの管理者かどうかを確認
ChannelSchema.statics.isChannelAdmin = async function (
  channelId: string,
  userId: string,
): Promise<boolean> {
  const channel = await this.findById(channelId);
  if (!channel) throw new AppError(404, errors.CHANNEL_NOT_FOUND);
  return channel.channelAdmin.toString() === userId;
};

// チャンネル一覧を取得
ChannelSchema.statics.getChannelList = async function (): Promise<IChannel[]> {
  return this.find({})
    .select('-__v -password')
    .populate('channelAdmin', '_id userName pic')
    .lean();
};

ChannelSchema.statics.updateChannelSettings = async function ({
  userId,
  channelId,
  channelName,
  channelDescription,
  passwordEnabled,
  password,
  denyGuests,
  numberOfPlayers,
}: {
  userId: string;
  channelId: string;
  channelName: string | null;
  channelDescription: string | null;
  passwordEnabled: boolean;
  password: string | null;
  denyGuests: boolean;
  numberOfPlayers: number;
}): Promise<[string, string, number]> {
  const isAdmin = await Channel.isChannelAdmin(channelId, userId);
  if (!isAdmin) throw new AppError(403, errors.PERMISSION_DENIED);

  const channel = await this.findById(channelId);
  if (channelName) channel.channelName = channelName;
  if (channelDescription) channel.channelDescription = channelDescription;
  if (!passwordEnabled) {
    channel.passwordEnabled = false;
  } else if (!channel.passwordEnabled && password) {
    channel.passwordEnabled = true;
  }
  if (passwordEnabled && password) channel.password = password;
  channel.denyGuests = denyGuests;
  channel.numberOfPlayers = numberOfPlayers;

  await channel.save();

  return [
    channel.channelName,
    channel.channelDescription,
    channel.numberOfPlayers,
  ];
};

ChannelSchema.pre<IChannel>('save', async function (next) {
  // パスワード設定を無効にする場合、パスワードを削除
  if (!this.passwordEnabled) {
    this.password = null;
    return next();
  }

  if (!this.isModified('password')) return next;

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// インデックスの作成
ChannelSchema.index({ admin: 1 });

const Channel = mongoose.model<IChannel, IChannelModel>(
  'Channel',
  ChannelSchema,
);

export default Channel;
