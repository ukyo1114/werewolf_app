import bcrypt from 'bcryptjs';
import { IChannel } from './ChannelTypes';

export const ChannelMiddleware = {
  async hashPassword(this: IChannel, next: any): Promise<void> {
    if (!this.passwordEnabled || !this.password) {
      this.passwordEnabled = false;
      this.password = undefined;
      return next();
    }
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  },
};
