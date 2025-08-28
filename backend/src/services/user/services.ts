import { IUserService } from './interfaces';
import Users from '@/models/Users';
import Channels from '@/models/Channels';
import ChannelUsers from '@/models/ChannelUsers';
import BlockedUsers from '@/models/BlockedUsers';
import Messages from '@/models/Messages';
import { TransactionHelper } from '@/utils/TransactionHelper';
import { ClientSession } from 'mongoose';
import { mailContent } from '../../config/mailContent';
import { genVerificationToken } from '@/utils/generateToken';
import { sendMail } from '@/controllers/verifyEmailController/utils';

export class UserService implements IUserService {
  async deleteUser(userId: string): Promise<void> {
    // TODO: ゲーム中のユーザーは削除できない
    await TransactionHelper.withTransaction(async (session) => {
      await this.deleteUserRelations(userId, session);
      await this.deleteUserChannels(userId, session);
      await Users.softDelete(userId, session);
    });
  }

  async updateProfile(
    userId: string,
    userName: string,
    pic: string,
  ): Promise<string | undefined> {
    // TODO: プロフィール画像のアップロード
    // TODO: プロフィール更新を通知
    const picUrl: string | undefined = 'kari';
    await Users.updateProfile(userId, { userName, pic: picUrl });
    return picUrl;
  }

  private async deleteUserRelations(
    userId: string,
    session: ClientSession,
  ): Promise<void> {
    await Promise.all([
      ChannelUsers.deleteMany({ userId }, { session }),
      BlockedUsers.deleteMany({ userId }, { session }),
    ]);
  }

  private async deleteUserChannels(
    userId: string,
    session: ClientSession,
  ): Promise<void> {
    const channels = await Channels.find({ channelAdmin: userId }, { session });
    await Promise.all([
      channels.map((channel) => {
        const channelId = channel._id.toString();
        return Promise.all([
          ChannelUsers.deleteMany({ channelId }, { session }),
          BlockedUsers.deleteMany({ channelId }, { session }),
          Messages.deleteMany({ channelId }, { session }),
          Channels.deleteChannel(channelId, userId, session),
        ]);
      }),
    ]);
  }

  async sendVerificationEmail(
    email: string,
    action: keyof typeof mailContent,
    userId?: string,
    currentPassword?: string,
  ): Promise<void> {
    if (action === 'changeEmail') {
      if (!userId || !currentPassword) throw new Error();
      await Users.authChangeEmail(userId, email, currentPassword);
    } else if (action === 'registerUser') {
      await Users.checkEmailAvailable(email);
    } else if (action === 'forgotPassword') {
      await Users.checkEmailRegisterd(email);
    }
    const verificationToken = genVerificationToken({
      userId,
      email,
      action,
    });

    await sendMail(email, verificationToken, action);
  }
}
