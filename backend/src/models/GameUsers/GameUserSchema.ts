import mongoose, { Schema } from 'mongoose';
import { IGameUser } from './GameUserTypes';

export const GameUserSchema = new Schema<IGameUser>(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Users',
    },
    role: {
      type: String,
      enum: [
        'villager',
        'seer',
        'medium',
        'hunter',
        'freemason',
        'werewolf',
        'madman',
        'fanatic',
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
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

GameUserSchema.index({ gameId: 1, userId: 1 }, { unique: true });
