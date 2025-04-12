import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { mailContent, sendMail } from './utils';
import { genVerificationToken } from '../../utils/generateToken';
import User from '../../models/userModel';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { CustomRequest } from '../../config/types';

export const sendVerificationEmail = (action: keyof typeof mailContent) =>
  asyncHandler(
    async (
      req: CustomRequest<{ email: string }>,
      res: Response,
    ): Promise<void> => {
      const userId = req.userId;
      const { email } = req.body;

      // ゲストアカウントによる操作を禁止
      if (action === 'changeEmail' && userId) {
        const user = await User.findById(userId).select('isGuest').lean();
        if (user?.isGuest) throw new AppError(403, errors.PERMISSION_DENIED);
      }

      const emailExists = await User.exists({ email });

      // メールアドレスを重複して登録できないようチェック
      if (
        (action === 'registerUser' || action === 'changeEmail') &&
        emailExists
      ) {
        throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);
      }

      // メールアドレスが登録されていなければ通知する
      if (action === 'forgotPassword' && !emailExists)
        throw new AppError(400, errors.EMAIL_NOT_REGISTERED);

      const verificationToken: string = genVerificationToken({
        userId,
        email,
        action,
      });

      await sendMail(email, verificationToken, action);

      res.status(202).send();
    },
  );
