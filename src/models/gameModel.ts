import mongoose, { Schema, Document, Types } from 'mongoose';

interface IGame extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  result:
    | 'running'
    | 'villagersWin'
    | 'werewolvesWin'
    | 'villageAbandoned'
    | 'foxesWin';
  numberOfPlayers: number;
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<IGame>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Channel',
      index: true,
    },
    result: {
      type: String,
      required: true,
      default: 'running',
      enum: [
        'running',
        'villagersWin',
        'werewolvesWin',
        'villageAbandoned',
        'foxesWin',
      ],
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

const Game = mongoose.model('Game', gameSchema);

export default Game;
