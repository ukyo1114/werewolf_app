import mongoose from 'mongoose';
import { UserSchema } from './UserSchema';
import { UserMethods } from './UserMethods';
import { UserStatics } from './UserStatics';
import { UserMiddleware } from './UserMiddleware';
import { IUser, IUserStatics } from './UserTypes';

// メソッドを追加
Object.assign(UserSchema.methods, UserMethods);
Object.assign(UserSchema.statics, UserStatics);

// ミドルウェアを追加
UserSchema.pre('save', UserMiddleware.hashPassword);

// モデルを作成
const Users = mongoose.model<IUser, IUserStatics>('Users', UserSchema);

export default Users;
export type { IUser, IUserStatics } from './UserTypes';
