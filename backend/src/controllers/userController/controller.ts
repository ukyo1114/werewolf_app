import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { Events } from '../../app';
import { decodeToken } from '../../utils/decodeToken';
import { genUserToken } from '../../utils/generateToken';
import User from '../../models/User';
import { uploadPicture } from './utils';
import {
  CustomRequest,
  IRegisterUser,
  ILogin,
  IUpdateProfile,
  IUpdateEmail,
  IChangePassword,
  IResetPassword,
} from '../../config/types';
import GameManager from '../../classes/GameManager';
import ChannelUser from '../../models/ChannelUser';

const { channelEvents } = Events;

export const registerUser = asyncHandler(
  async (req: CustomRequest<IRegisterUser>, res: Response): Promise<void> => {
    const { userName, password, token } = req.body;

    const { email, action } = decodeToken(token);
    if (action !== 'registerUser') {
      throw new AppError(401, errors.INVALID_TOKEN);
    }

    const emailExists = await User.exists({ email });
    if (emailExists) throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);

    const newUser = await User.create({
      userName,
      email,
      password,
      pic: null,
      isGuest: false,
    });

    res.status(201).json({
      userId: newUser._id.toString(),
      token: genUserToken(newUser._id.toString()),
    });
  },
);

export const login = asyncHandler(
  async (req: CustomRequest<ILogin>, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const dbUser = await User.login(email, password);

    const user = {
      userId: dbUser._id.toString(),
      userName: dbUser.userName,
      pic: dbUser.pic,
      token: genUserToken(dbUser._id.toString()),
    };

    res.status(200).json(user);
  },
);

export const loginAsGuest = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const guestUser = await User.create({ isGuest: true });

    res.status(200).json({
      userId: guestUser._id.toString(),
      token: genUserToken(guestUser._id.toString()),
    });
  },
);

export const updateProfile = asyncHandler(
  async (req: CustomRequest<IUpdateProfile>, res: Response): Promise<void> => {
    const userId = req.userId as string;
    const { userName, pic } = req.body;
    if (!userName && !pic) throw new AppError(400, errors.NO_UPDATE_DATA);

    const result = GameManager.checkIsUserInGame(userId);
    if (result) throw new AppError(400, errors.USER_IN_GAME);

    let picUrl = null;
    if (pic) picUrl = await uploadPicture({ userId, pic });
    if (userName) {
      await User.findByIdAndUpdate(
        userId,
        { userName },
        { runValidators: true },
      );
    }

    // プロフィール更新を通知
    const channelIds = await ChannelUser.getParticipantingChannels(userId);
    const data = { userId, userName, pic };
    channelEvents.emit('updateProfile', channelIds, data);

    res.status(200).json({ pic: picUrl });
  },
);

export const updateEmail = asyncHandler(
  async (req: Request<IUpdateEmail>, res: Response): Promise<void> => {
    const { token } = req.params;
    const { userId, email, action } = decodeToken(token);
    if (action !== 'changeEmail') throw new AppError(401, errors.INVALID_TOKEN);
    await User.updateEmail(userId, email);

    res.status(200).send('メールアドレスが変更されました');
  },
);

export const changePassword = asyncHandler(
  async (req: CustomRequest<IChangePassword>, res: Response): Promise<void> => {
    const userId = req.userId as string;
    const { currentPassword, newPassword } = req.body;
    await User.changePassword(userId, currentPassword, newPassword);

    res.status(200).send();
  },
);

export const resetPassword = asyncHandler(
  async (req: CustomRequest<IResetPassword>, res: Response): Promise<void> => {
    const { password, token } = req.body;
    const { email, action } = decodeToken(token);
    if (action !== 'forgotPassword') {
      throw new AppError(401, errors.INVALID_TOKEN);
    }
    await User.resetPassword(email, password);

    res.status(200).send();
  },
);
