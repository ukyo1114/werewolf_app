import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { mailContent, sendMail } from './utils';
import { genVerificationToken } from '../../utils/generateToken';
import User from '../../models/userModel';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';

interface CustomRequest<TBody = {}, TParams = {}, TQuery = {}>
  extends Request<TParams, any, TBody, TQuery> {
  userId?: string;
}

interface IEmail {
  email: string;
}

export const sendVerificationEmail = (action: keyof typeof mailContent) =>
  asyncHandler(
    async (req: CustomRequest<IEmail>, res: Response): Promise<void> => {
      const userId = req.userId;
      const { email } = req.body;

      // NOTE: メールアドレスの重複をチェック
      if (action === 'registerUser' || action === 'changeEmail') {
        const emailExists = await User.exists({ email });
        if (emailExists)
          throw new AppError(400, errors.EMAIL_ALREADY_REGISTERED);
      }

      const verificationToken: string = genVerificationToken({
        userId,
        email,
        action,
      });

      await sendMail(email, verificationToken, action);

      res.status(202).send();
    },
  );
