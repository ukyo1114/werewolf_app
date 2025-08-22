import { IUser, IUserStatics } from './UserTypes';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';

export const UserStatics = {
  // ゲストユーザー確認
  async isGuestUser(userId: string): Promise<boolean> {
    const Users = this as any;
    const user = await Users.findById(userId).select('isGuest');
    if (!user) {
      throw new Error(`ユーザーが見つかりません: ${userId}`);
    }
    return user.isGuest;
  },

  // ログイン処理
  async login(email: string, password: string): Promise<IUser> {
    const user = await this.findActiveUserByEmail(email);
    if (!user) throw new Error(`ユーザーが見つかりません: ${email}`);
    if (!(await user.matchPassword(password))) {
      throw new Error('パスワードが間違っています');
    }
    return user;
  },

  // メールアドレス更新
  async updateEmail(userId: string, email: string): Promise<void> {
    const Users = this as any;
    try {
      const isRecentlyDeleted = await Users.isEmailRecentlyDeleted(email);
      if (isRecentlyDeleted) {
        throw new AppError(
          400,
          'このメールアドレスは最近削除されたユーザーで使用されていました。24時間後に再登録可能です。',
        );
      }

      const user = await Users.findByIdAndUpdate(
        userId,
        { email },
        { runValidators: true },
      );
      if (!user) throw new AppError(401, errors.USER_NOT_FOUND);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);
      }
      throw error;
    }
  },

  // パスワード変更
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const Users = this as any;
    const user = await Users.findById(userId);
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);
    if (user.isGuest) throw new AppError(403, errors.PERMISSION_DENIED);
    if (!(await user.matchPassword(currentPassword))) {
      throw new AppError(401, errors.WRONG_PASSWORD);
    }
    user.password = newPassword;
    await user.save();
  },

  // パスワードリセット
  async resetPassword(email: string, password: string): Promise<void> {
    const Users = this as any;
    const user = await Users.findOne({ email, deletedAt: null });
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);
    user.password = password;
    await user.save();
  },

  // ユーザーのソフトデリート
  async softDeleteUser(userId: string): Promise<void> {
    const Users = this as any;
    const user = await Users.findById(userId);
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);

    await user.cleanupRelatedData(user._id);
    await user.softDelete();
  },

  // メールアドレスが最近削除されたかチェック
  async isEmailRecentlyDeleted(email: string): Promise<boolean> {
    const Users = this as any;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deletedUser = await Users.findOne({
      email,
      deletedAt: { $gte: twentyFourHoursAgo },
    });

    return !!deletedUser;
  },

  // アクティブなユーザーをメールアドレスで検索
  async findActiveUserByEmail(email: string): Promise<IUser | null> {
    const Users = this as any;
    return await Users.findOne({
      email,
      deletedAt: undefined,
    });
  },
};
