import mongoose, { Schema, Document, Types } from 'mongoose';

interface IGameUser extends Document {
  _id: Types.ObjectId;
  gameId: Types.ObjectId;
  userId: Types.ObjectId;
  role:
    | 'villager'
    | 'seer'
    | 'medium'
    | 'hunter'
    | 'freemason'
    | 'werewolf'
    | 'madman'
    | 'fox'
    | 'immoralist'
    | 'spectator';
  isPlaying: Boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IGameUserModel extends mongoose.Model<IGameUser> {
  joinGame(gameId: string, userId: string): Promise<void>;
  getGameUsers(gameId: string): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  >;
  isUserPlaying(userId: string): Promise<string | null>;
  endGame(gameId: string): Promise<void>;
}

const GameUserSchema = new Schema<IGameUser>(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User',
    },
    role: {
      type: String,
      required: true,
      enum: [
        'villager',
        'seer',
        'medium',
        'hunter',
        'freemason',
        'werewolf',
        'madman',
        'fox',
        'immoralist',
        'spectator',
      ],
      default: 'spectator',
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

GameUserSchema.index({ gameId: 1, userId: 1 }, { unique: true });

GameUserSchema.statics.joinGame = async function (
  gameId: string,
  userId: string,
): Promise<void> {
  const gameUser = await this.findOne({ gameId, userId });
  if (!gameUser) {
    await this.create({ gameId, userId });
  }
};

GameUserSchema.statics.getGameUsers = async function (
  gameId: string,
): Promise<IGameUser[]> {
  const users = await this.find({ gameId })
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

GameUserSchema.statics.isUserPlaying = async function (
  userId: string,
): Promise<string | null> {
  const gameUser = await this.findOne({ userId, isPlaying: true });
  return gameUser?.gameId.toString() || null;
};

GameUserSchema.statics.endGame = async function (
  gameId: string,
): Promise<void> {
  await this.updateMany({ gameId }, { $set: { isPlaying: false } });
};

const GameUser = mongoose.model<IGameUser, IGameUserModel>(
  'GameUser',
  GameUserSchema,
);

export default GameUser;
