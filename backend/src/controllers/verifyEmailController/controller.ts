import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { mailContent } from '../../config/mailContent';
import { sendMail } from './utils';
import { genVerificationToken } from '../../utils/generateToken';
import User from '../../models/User';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { CustomRequest } from '../../config/types';

export const sendVerificationEmail = (action: keyof typeof mailContent) =>
  asyncHandler(
    async (
      req: CustomRequest<{
        email: string;
        currentPassword: string | undefined;
      }>,
      res: Response,
    ): Promise<void> => {
      const userId = req.userId;
      const { email, currentPassword } = req.body;

      // ゲストアカウントによる操作を禁止
      if (action === 'changeEmail' && userId) {
        const user = await User.findById(userId);
        if (user?.isGuest) throw new AppError(403, errors.PERMISSION_DENIED);
        if (!currentPassword || !(await user?.matchPassword(currentPassword)))
          throw new AppError(401, errors.WRONG_PASSWORD);
      }

      const emailExists = await User.exists({ email });

      // メールアドレスを重複して登録できないようチェック
      if (
        (action === 'registerUser' || action === 'changeEmail') &&
        emailExists
      )
        throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);

      // メールアドレスが登録されていなければ通知する
      if (action === 'forgotPassword' && !emailExists)
        throw new AppError(400, errors.EMAIL_NOT_REGISTERED);

      const verificationToken: string = genVerificationToken({
        userId: userId || null,
        email,
        action,
      });

      try {
        await sendMail(email, verificationToken, action);
      } catch (error) {
        console.error(error);
        throw new AppError(500, errors.EMAIL_SEND_FAILED);
      }

      res.status(202).send();
    },
  );
