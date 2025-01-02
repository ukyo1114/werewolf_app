import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { mailContent, sendMail } from './utils';
import { genVerificationToken } from '../../utils/generateToken';

interface CustomRequest extends Request {
  userId?: string;
}

// TODO: action === registerUser || changeEmailのときデータベースチェックを追加してメールアドレスの重複を回避
export const sendVerificationEmail = (action: keyof typeof mailContent) =>
  asyncHandler(async (req: CustomRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    const { email }: { email: string } = req.body;
    const verificationToken: string = genVerificationToken({
      userId,
      email,
      action,
    });
    await sendMail(email, verificationToken, action);

    res.status(202).send();
  });
