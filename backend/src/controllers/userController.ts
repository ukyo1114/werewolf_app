import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import Users from '../models/Users';
import {
  CustomRequest,
  IRegisterUser,
  ILogin,
  IUpdateProfile,
  IUpdateEmail,
  IChangePassword,
  IResetPassword,
} from '../config/types';
import { userService } from '../services/user/services';

export const registerUser = asyncHandler(
  async (req: CustomRequest<IRegisterUser>, res: Response): Promise<void> => {
    const { userName, password, token } = req.body;
    const data = await userService.registerUser(userName, password, token);
    res.status(201).json(data);
  },
);

export const login = asyncHandler(
  async (req: CustomRequest<ILogin>, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const data = await userService.login(email, password);
    res.status(200).json(data);
  },
);

export const loginAsGuest = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await userService.loginAsGuest();
    res.status(200).json(data);
  },
);

export const updateProfile = asyncHandler(
  async (req: CustomRequest<IUpdateProfile>, res: Response): Promise<void> => {
    const userId = req.userId as string;
    const { userName, pic } = req.body;
    if (!userName && !pic) throw new AppError(400, errors.NO_UPDATE_DATA);

    const picUrl = await userService.updateProfile({ userId, userName, pic });
    res.status(200).json({ pic: picUrl });
  },
);

export const updateEmail = asyncHandler(
  async (req: Request<IUpdateEmail>, res: Response): Promise<void> => {
    const { token } = req.params;
    await userService.updateEmail(token);
    res.status(200).send();
  },
);

export const changePassword = asyncHandler(
  async (req: CustomRequest<IChangePassword>, res: Response): Promise<void> => {
    const userId = req.userId as string;
    const { currentPassword, newPassword } = req.body;
    await Users.changePassword(userId, currentPassword, newPassword);
    res.status(200).send();
  },
);

export const resetPassword = asyncHandler(
  async (req: CustomRequest<IResetPassword>, res: Response): Promise<void> => {
    const { password, token } = req.body;
    await userService.resetPassword(password, token);
    res.status(200).send();
  },
);

export const deleteUser = asyncHandler(
  async (req: CustomRequest, res: Response): Promise<void> => {
    const userId = req.userId as string;
    await userService.deleteUser(userId);
    res.status(200).send();
  },
);
