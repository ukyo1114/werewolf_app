import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { mailContent } from '../config/mailContent';
import { CustomRequest } from '../config/types';
import { userService } from '../services/user/services';

export const sendVerificationEmail = (action: keyof typeof mailContent) =>
  asyncHandler(
    async (
      req: CustomRequest<{
        email: string;
        currentPassword?: string;
      }>,
      res: Response,
    ): Promise<void> => {
      const userId = req.userId;
      const { email, currentPassword } = req.body;

      await userService.sendVerificationEmail(
        email,
        action,
        userId,
        currentPassword,
      );

      res.status(202).send();
    },
  );
