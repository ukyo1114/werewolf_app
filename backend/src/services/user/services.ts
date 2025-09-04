import { IUserService } from './interfaces';
import Users from '../../models/Users';
import Channels from '../../models/Channels';
import ChannelUsers from '../../models/ChannelUsers';
import BlockedUsers from '../../models/BlockedUsers';
import GameUsers from '../../models/GameUsers';
import Messages from '../../models/Messages';
import { decodeToken } from '../../utils/decodeToken';
import { genUserToken } from '../../utils/generateToken';
import { mailContent } from '../../config/mailContent';
import { genVerificationToken } from '../../utils/generateToken';
import { sendMail } from '../../utils/sendMail';
import { uploadPicture } from '../../utils/uploadPicture';
import { Events } from '../../config/appState';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';

const { channelEvents } = Events;

export class UserService implements IUserService {
  async registerUser(
    userName: string,
    password: string,
    token: string,
  ): Promise<{ userId: string; token: string }> {
    const { email, action } = decodeToken(token);
    if (action !== 'registerUser')
      throw new AppError(401, errors.INVALID_TOKEN);

    const userId = await Users.register(userName, email, password);
    return { userId, token: genUserToken(userId) };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    userId: string;
    userName: string;
    pic?: string;
    token: string;
  }> {
    const user = await Users.login(email, password);
    return {
      userId: user._id.toString(),
      userName: user.userName,
      pic: user.pic,
      token: genUserToken(user._id.toString()),
    };
  }

  async loginAsGuest(): Promise<{ userId: string; token: string }> {
    const user = await Users.loginAsGuest();
    return {
      userId: user._id.toString(),
      token: genUserToken(user._id.toString()),
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await GameUsers.checkUserPlaying(userId);

    await this.deleteUserRelations(userId);
    await this.deleteUserChannels(userId);
    await Users.softDelete(userId);
  }

  async updateProfile({
    userId,
    userName,
    pic,
  }: {
    userId: string;
    userName?: string;
    pic?: string;
  }): Promise<string | undefined> {
    const picUrl = pic && (await uploadPicture({ userId, pic }));
    await Users.updateProfile(userId, { userName, pic: picUrl });
    const channelIds = await ChannelUsers.getParticipantingChannels(userId);
    const data = { userId, userName, pic: picUrl };
    channelEvents.emit('updateProfile', channelIds, data);

    return picUrl;
  }

  async updateEmail(token: string): Promise<void> {
    const { userId, email, action } = decodeToken(token);
    if (action !== 'changeEmail') throw new AppError(401, errors.INVALID_TOKEN);
    await Users.updateEmail(userId, email);
  }

  async resetPassword(password: string, token: string): Promise<void> {
    const { email, action } = decodeToken(token);
    if (action !== 'forgotPassword')
      throw new AppError(401, errors.INVALID_TOKEN);
    await Users.resetPassword(email, password);
  }

  private async deleteUserRelations(userId: string): Promise<void> {
    await Promise.all([
      ChannelUsers.deleteMany({ userId }),
      BlockedUsers.deleteMany({ userId }),
    ]);
  }

  private async deleteUserChannels(userId: string): Promise<void> {
    const channels = await Channels.find({ channelAdmin: userId });
    await Promise.all([
      channels.map((channel) => {
        const channelId = channel._id.toString();
        return Promise.all([
          ChannelUsers.deleteMany({ channelId }),
          BlockedUsers.deleteMany({ channelId }),
          Messages.deleteMany({ channelId }),
          Channels.deleteChannel(channelId, userId),
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

export const userService = new UserService();
