import mongoose from 'mongoose';
import { GameUserSchema } from './GameUserSchema';
import { GameUserStatics } from './GameUserStatics';
import { IGameUser, IGameUserStatics } from './GameUserTypes';

// スキーマにスタティックメソッドを追加
Object.assign(GameUserSchema.statics, GameUserStatics);

// モデルを作成してエクスポート
const GameUsers = mongoose.model<IGameUser, IGameUserStatics>(
  'GameUsers',
  GameUserSchema,
);

export default GameUsers;
export type { IGameUser, IGameUserStatics } from './GameUserTypes';
