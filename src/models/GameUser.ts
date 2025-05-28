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
  createdAt: Date;
  updatedAt: Date;
}

interface IGameUserModel extends mongoose.Model<IGameUser> {
  joinGame(gameId: string, userId: string): Promise<void>;
  getGameUsers(gameId: string): Promise<IGameUser[]>;
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
    .populate('userId', '_id userName pic')
    .lean();

  return users.map(
    (user: {
      userId: { _id: Types.ObjectId; userName: string; pic: string | null };
    }) => user.userId,
  );
};

const GameUser = mongoose.model<IGameUser, IGameUserModel>(
  'GameUser',
  GameUserSchema,
);

export default GameUser;
