import { IUser, IUserStatics } from './UserTypes';
import { errors } from '../../config/messages';

export const UserStatics = {
  async isGuest(this: IUserStatics, userId: string): Promise<boolean> {
    const user = await this.findActiveUserById(userId);
    return user.isGuest;
  },

  async register(
    this: IUserStatics,
    userName: string,
    email: string,
    password: string,
  ): Promise<string> {
    await this.checkEmailRecentlyDeleted(email);
    const user = await this.create({ userName, password, email });
    return user._id.toString();
  },

  async login(
    this: IUserStatics,
    email: string,
    password: string,
  ): Promise<IUser> {
    const user = await this.findActiveUserByEmail(email);
    await user.matchPassword(password);
    return user;
  },

  async loginAsGuest(this: IUserStatics): Promise<IUser> {
    const user = await this.create({ isGuest: true });
    return user;
  },

  async updateEmail(
    this: IUserStatics,
    userId: string,
    email: string,
  ): Promise<void> {
    await this.checkEmailRecentlyDeleted(email);

    const user = await this.findActiveUserById(userId);
    await user.updateEmail(email);
  },

  async changePassword(
    this: IUserStatics,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findActiveUserById(userId);
    await user.changePassword(currentPassword, newPassword);
  },

  async resetPassword(
    this: IUserStatics,
    email: string,
    password: string,
  ): Promise<void> {
    const user = await this.findActiveUserByEmail(email);
    await user.resetPassword(password);
  },

  async softDelete(this: IUserStatics, userId: string): Promise<void> {
    const user = await this.findActiveUserById(userId);
    await user.softDelete();
  },

  async findActiveUserById(this: IUserStatics, userId: string): Promise<IUser> {
    const user = await this.findOne({ _id: userId, deletedAt: undefined });
    if (!user) throw new Error(errors.USER_NOT_FOUND);
    return user;
  },

  async checkEmailRecentlyDeleted(
    this: IUserStatics,
    email: string,
  ): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deletedUser = await this.findOne({
      email,
      deletedAt: { $gte: twentyFourHoursAgo },
    });

    if (deletedUser) throw new Error(errors.EMAIL_RESENTLY_DELETED);
  },

  async findActiveUserByEmail(
    this: IUserStatics,
    email: string,
  ): Promise<IUser> {
    const user = await this.findOne({
      email,
      deletedAt: undefined,
    });
    if (!user) throw new Error(errors.USER_NOT_FOUND);
    return user;
  },

  async updateProfile(
    this: IUserStatics,
    userId: string,
    data: { userName?: string; pic?: string },
  ): Promise<void> {
    const user = await this.findActiveUserById(userId);
    await user.updateProfile(data);
  },
};
