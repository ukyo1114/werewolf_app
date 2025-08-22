import mongoose from 'mongoose';
import { GameSchema } from './GameSchema';
import { GameMethods } from './GameMethods';
import { GameStatics } from './GameStatics';
import { IGame, IGameStatics } from './GameTypes';

// スキーマにメソッドとスタティックメソッドを追加
Object.assign(GameSchema.methods, GameMethods);
Object.assign(GameSchema.statics, GameStatics);

// モデルを作成してエクスポート
const Games = mongoose.model<IGame, IGameStatics>(
  'Games', // コレクション名を複数形に変更
  GameSchema,
);

export default Games;
export type { IGame, IGameStatics } from './GameTypes';
