import mongoose from 'mongoose';
import { GameSchema } from './GameSchema';
import { GameStatics } from './GameStatics';
import { IGame, IGameStatics } from './GameTypes';

Object.assign(GameSchema.statics, GameStatics);

const Games = mongoose.model<IGame, IGameStatics>('Games', GameSchema);

export default Games;
export type { IGame, IGameStatics } from './GameTypes';
