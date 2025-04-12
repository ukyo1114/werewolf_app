import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { decodeToken } from '../../utils/decodeToken';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import User from '../../models/userModel';
import { genUserToken } from '../../utils/generateToken';
import uploadPicture from './utils';
import {
  CustomRequest,
  IRegisterUser,
  ILogin,
  IUpdateProfile,
  IUpdateEmail,
  IChangePassword,
  IResetPassword,
} from '../../config/types';

export const registerUser = asyncHandler(
  async (req: CustomRequest<IRegisterUser>, res: Response): Promise<void> => {
    const { userName, password, token } = req.body;

    const { email, action } = decodeToken(token);
    if (action !== 'registerUser') {
      throw new AppError(401, errors.INVALID_TOKEN);
    }

    const emailExists = await User.exists({ email });
    if (emailExists) throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);

    await User.create({
      userName,
      email,
      password,
      pic: null,
      isGuest: false,
    });

    res.status(201).send();
  },
);

export const login = asyncHandler(
  async (req: CustomRequest<ILogin>, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const dbUser = await User.findOne({ email });
    if (!dbUser) throw new AppError(400, errors.EMAIL_NOT_FOUND);

    if (!(await dbUser.matchPassword(password))) {
      throw new AppError(401, errors.WRONG_PASSWORD);
    }

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
    const guestUser = await User.create({});

    res.status(200).json({
      userId: guestUser._id.toString(),
      token: genUserToken(guestUser._id.toString()),
    });
  },
);

// TODO: 更新を通知する処理を追加
export const updateProfile = asyncHandler(
  async (req: CustomRequest<IUpdateProfile>, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { userName, pic } = req.body;

    if (!userName && !pic) throw new AppError(400, errors.NO_UPDATE_DATA);

    // TODO: ユーザーがゲーム中の場合エラーを返す

    if (pic) await uploadPicture({ userId, pic });
    if (userName)
      await User.findByIdAndUpdate(
        userId,
        { userName },
        { runValidators: true },
      );

    res.status(200).send();
  },
);

// TODO: エラーの表示を確認
export const updateEmail = asyncHandler(
  async (req: Request<IUpdateEmail>, res: Response): Promise<void> => {
    const { token } = req.params;

    const { userId, email, action } = decodeToken(token);
    if (action !== 'changeEmail') {
      throw new AppError(401, errors.INVALID_TOKEN);
    }

    const emailExists = await User.exists({ email });
    if (emailExists) throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);

    const user = await User.findByIdAndUpdate(
      userId,
      { email },
      { runValidators: true },
    );
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);

    res.status(200).send(); // TODO: 認証完了ページを送信
  },
);

export const changePassword = asyncHandler(
  async (req: CustomRequest<IChangePassword>, res: Response): Promise<void> => {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('password isGuest');
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);
    if (user.isGuest) throw new AppError(403, errors.PERMISSION_DENIED);

    if (!(await user.matchPassword(currentPassword))) {
      throw new AppError(401, errors.WRONG_PASSWORD);
    }

    user.password = newPassword;
    await user.save();

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

    const user = await User.findOne({ email }).select('password');
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);

    user.password = password;
    await user.save();

    res.status(200).send();
  },
);
