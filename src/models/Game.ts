import mongoose, { Schema, Document, Types, Model } from 'mongoose';

interface IGame extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  result:
    | 'running'
    | 'villagersWin'
    | 'werewolvesWin'
    | 'foxesWin'
    | 'villageAbandoned';
  numberOfPlayers: number;
  createdAt: Date;
  updatedAt: Date;
  endGame(result: Exclude<IGame['result'], 'running'>): Promise<IGame>;
}

interface IGameModel extends Model<IGame> {
  getRunningGame(channelId: string): Promise<IGame | null>;
}

const GameSchema = new Schema<IGame>(
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
        'foxesWin',
        'villageAbandoned',
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

// 進行中のゲームを取得する静的メソッド
GameSchema.statics.getRunningGame = async function (
  channelId: string,
): Promise<IGame[]> {
  return this.find({ channelId, result: 'running' });
};

// ゲームを終了するインスタンスメソッド
GameSchema.methods.endGame = async function (
  result: Exclude<IGame['result'], 'running'>,
) {
  this.result = result;
  return this.save();
};

const Game = mongoose.model<IGame, IGameModel>('Game', GameSchema);

export default Game;
