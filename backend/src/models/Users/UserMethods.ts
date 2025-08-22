import bcrypt from 'bcryptjs';
import { IUser } from './UserTypes';

export const UserMethods = {
  // パスワード照合
  async matchPassword(this: IUser, enteredPassword: string): Promise<boolean> {
    if (!this.password) throw new Error('パスワードが設定されていません');
    return await bcrypt.compare(enteredPassword, this.password);
  },

  // 削除状態確認
  isDeleted(this: IUser): boolean {
    return this.deletedAt !== null;
  },

  // ソフトデリート実行
  async softDelete(this: IUser): Promise<void> {
    this.deletedAt = new Date();
    await this.save();
  },

  // 削除状態から復元
  async restore(this: IUser): Promise<void> {
    this.deletedAt = undefined;
    await this.save();
  },
};
