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

const gameUserSchema = new Schema<IGameUser>(
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

// 同じゲームとユーザーの組み合わせは一意である必要がある
gameUserSchema.index({ gameId: 1, userId: 1 }, { unique: true });

const GameUser = mongoose.model('GameUser', gameUserSchema);

export default GameUser;
