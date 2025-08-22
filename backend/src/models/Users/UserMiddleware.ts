import bcrypt from 'bcryptjs';
import { IUser } from './UserTypes';

export const UserMiddleware = {
  // パスワードハッシュ化
  async hashPassword(this: IUser, next: any): Promise<void> {
    if (!this.isModified('password') || this.isGuest) return next();

    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  },
};
