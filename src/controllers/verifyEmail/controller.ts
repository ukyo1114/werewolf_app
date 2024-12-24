import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { mailContent, sendMail } from './utils';
import { genVerificationToken } from '../../utils/generateToken';

export const sendVerificationEmail = (action: keyof typeof mailContent) =>
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email }: { email: string } = req.body;
    const verificationToken: string = genVerificationToken({ email, action });
    await sendMail(email, verificationToken, action);
    // モードによりトークンを検証
    res.status(202).send();
  });
