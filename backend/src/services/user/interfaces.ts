import { mailContent } from '../../config/mailContent';

export interface IUserService {
  registerUser(
    userName: string,
    password: string,
    token: string,
  ): Promise<{ userId: string; token: string }>;

  login(
    email: string,
    password: string,
  ): Promise<{ userId: string; userName: string; pic?: string; token: string }>;

  loginAsGuest(): Promise<{ userId: string; token: string }>;

  deleteUser(userId: string): Promise<void>;

  updateProfile(data: {
    userId: string;
    userName?: string;
    pic?: string;
  }): Promise<string | undefined>;

  updateEmail(token: string): Promise<void>;

  sendVerificationEmail(
    email: string,
    action: keyof typeof mailContent,
    userId?: string,
    currentPassword?: string | undefined,
  ): Promise<void>;
}
