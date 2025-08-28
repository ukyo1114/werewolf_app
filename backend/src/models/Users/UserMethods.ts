import bcrypt from 'bcryptjs';
import { IUser } from './UserTypes';
import AppError from '@/utils/AppError';
import { errors } from '../../config/messages';

export const UserMethods = {
  async matchPassword(this: IUser, enteredPassword: string): Promise<void> {
    if (!this.password) throw new Error();
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    if (!isMatch) throw new AppError(400, errors.WRONG_PASSWORD);
  },

  async changePassword(
    this: IUser,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.matchPassword(currentPassword);
    this.password = newPassword;
    await this.save();
  },

  async resetPassword(this: IUser, password: string): Promise<void> {
    this.password = password;
    await this.save();
  },

  async updateEmail(this: IUser, email: string): Promise<void> {
    this.email = email;
    await this.save();
  },

  async updateProfile(
    this: IUser,
    data: { userName?: string; pic?: string },
  ): Promise<void> {
    Object.assign(this, data);
    await this.save();
  },
};
