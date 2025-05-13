import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../config/types';

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
  email?: string;
  password?: string;
  pic: string;
  isGuest: boolean;
  gameStats: IGameStats;
  matchPassword(enteredPassword: string): Promise<boolean>;
  updateGameStats(role: Role, isVictory: boolean): Promise<void>;
  isModified: (path: string) => boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gameStatsSchema = new Schema<IGameStats>({
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
    gameStats: {
      type: gameStatsSchema,
      default: () => ({}),
    },
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

userSchema.methods.updateGameStats = async function (
  role: Role,
  isVictory: boolean,
): Promise<void> {
  this.gameStats.totalGames += 1;
  if (isVictory) {
    this.gameStats.victories += 1;
  }

  const roleStats = this.gameStats.roleStats[role] || {
    totalGames: 0,
    victories: 0,
  };

  roleStats.totalGames += 1;
  if (isVictory) {
    roleStats.victories += 1;
  }

  this.gameStats.roleStats[role] = roleStats;

  await this.save();
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
