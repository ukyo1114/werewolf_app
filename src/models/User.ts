import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../config/types';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

interface IGameStats {
  totalGames: number;
  victories: number;
  roleStats: {
    [key in Role]?: {
      totalGames: number;
      victories: number;
    };
  };
}

interface IUser extends Document {
  _id: Types.ObjectId;
  userName: string;
  email: string | undefined;
  password: string | null;
  pic: string | null;
  isGuest: boolean;
  GameStats: IGameStats;
  matchPassword(enteredPassword: string): Promise<boolean>;
  updateGameStats(role: Role, isVictory: boolean): Promise<void>;
  isModified: (path: string) => boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserModel extends mongoose.Model<IUser> {
  isGuestUser(userId: string): Promise<boolean>;
  login(email: string, password: string): Promise<IUser>;
  updateEmail(userId: string, email: string): Promise<void>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>;
  resetPassword(email: string, password: string): Promise<void>;
}

const GameStatsSchema = new Schema<IGameStats>({
  totalGames: {
    type: Number,
    default: 0,
    min: 0,
  },
  victories: {
    type: Number,
    default: 0,
    min: 0,
  },
  roleStats: {
    type: Map,
    of: {
      totalGames: {
        type: Number,
        default: 0,
        min: 0,
      },
      victories: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    default: {},
  },
});

const UserSchema = new Schema<IUser>(
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
      default: undefined,
    },
    password: { type: String, minlength: 8, default: null },
    pic: { type: String, default: null },
    isGuest: { type: Boolean, default: false, required: true },
    GameStats: {
      type: GameStatsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.methods.matchPassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.updateGameStats = async function (
  role: Role,
  isVictory: boolean,
): Promise<void> {
  this.GameStats.totalGames += 1;
  if (isVictory) {
    this.GameStats.victories += 1;
  }

  const roleStats = this.GameStats.roleStats[role] || {
    totalGames: 0,
    victories: 0,
  };

  roleStats.totalGames += 1;
  if (isVictory) {
    roleStats.victories += 1;
  }

  this.GameStats.roleStats[role] = roleStats;

  await this.save();
};

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || this.isGuest) return next;

  const salt = await bcrypt.genSalt(10);

  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// ゲストユーザーかどうかを確認
UserSchema.statics.isGuestUser = async function (
  userId: string,
): Promise<boolean> {
  const user = await this.findById(userId);
  if (!user) {
    throw new Error(`User not found with id: ${userId}`);
  }
  return user.isGuest;
};

UserSchema.statics.login = async function (
  email: string,
  password: string,
): Promise<IUser> {
  const user = await this.findOne({ email });
  if (!user) throw new AppError(400, errors.EMAIL_NOT_FOUND);
  if (!(await user.matchPassword(password))) {
    throw new AppError(401, errors.WRONG_PASSWORD);
  }

  return user;
};

UserSchema.statics.updateEmail = async function (
  userId: string,
  email: string,
): Promise<void> {
  try {
    const user = await this.findByIdAndUpdate(
      userId,
      { email },
      { runValidators: true },
    );
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);
    }
    throw error;
  }
};

UserSchema.statics.changePassword = async function (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await this.findById(userId);
  if (!user) throw new AppError(401, errors.USER_NOT_FOUND);
  if (user.isGuest) throw new AppError(403, errors.PERMISSION_DENIED);
  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError(401, errors.WRONG_PASSWORD);
  }
  user.password = newPassword;
  await user.save();
};

UserSchema.statics.resetPassword = async function (
  email: string,
  password: string,
): Promise<void> {
  const user = await this.findOne({ email });
  if (!user) throw new AppError(401, errors.USER_NOT_FOUND);
  user.password = password;
  await user.save();
};

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
