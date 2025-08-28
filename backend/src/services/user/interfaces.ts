import { mailContent } from '../../config/mailContent';

export interface IUserService {
  deleteUser(userId: string): Promise<void>;
  updateProfile(
    userId: string,
    userName: string,
    pic: string,
  ): Promise<string | undefined>;
  sendVerificationEmail(
    email: string,
    action: keyof typeof mailContent,
    userId?: string,
    currentPassword?: string | undefined,
  ): Promise<void>;
}
