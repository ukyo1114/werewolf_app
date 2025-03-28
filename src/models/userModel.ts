import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  _id: Types.ObjectId;
  userName: string;
  email?: string;
  password?: string;
  pic: string;
  isGuest: boolean;
  matchPassword(enteredPassword: string): Promise<boolean>;
  isModified: (path: string) => boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userName: {
      type: String,
      required: true,
      maxlength: 20,
      default: 'ゲスト',
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, minlength: 8 },
    pic: { type: String },
    isGuest: { type: Boolean, default: true, required: true },

    // TODO: 将来的にゲームの戦績を記録するフィールドを追加予定
    // - totalGames: 総試合数
    // - victories: 勝利数
    // - defeats: 敗北数
    // - rate: レーティング
  },
  {
    timestamps: true,
  },
);

userSchema.methods.matchPassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || this.isGuest) return next;

  const salt = await bcrypt.genSalt(10);

  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

const User = mongoose.model('User', userSchema);

export default User;
