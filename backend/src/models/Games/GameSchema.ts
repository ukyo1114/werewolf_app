import mongoose, { Schema } from 'mongoose';
import { IGame } from './GameTypes';

// Gameスキーマの定義
export const GameSchema = new Schema<IGame>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Channels', // ChannelからChannelsに変更
      index: true,
    },
    result: {
      type: String,
      default: 'running',
      enum: [
        'running',
        'villagersWin',
        'werewolvesWin',
        'foxesWin',
        'villageAbandoned',
      ],
    },
    numberOfPlayers: {
      type: Number,
      default: 10,
      min: 5,
      max: 20,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);
