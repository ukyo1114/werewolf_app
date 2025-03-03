import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IChannel extends Document {
  _id: Types.ObjectId;
  channelName: string;
  channelDescription: string;
  passwordEnabled: boolean;
  password: string | undefined;
  channelAdmin: Types.ObjectId;
  denyGuests: boolean;
  numberOfPlayers: number;
  matchPassword(enteredPassword: string): Promise<boolean>;
  isModified: (path: string) => boolean;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
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

channelSchema.methods.matchPassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

channelSchema.pre<IChannel>('save', async function (next) {
  // パスワード設定を無効にする場合、パスワードを削除
  if (!this.passwordEnabled) {
    this.password = undefined;
    return next();
  }

  if (!this.isModified('password')) return next;

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;
