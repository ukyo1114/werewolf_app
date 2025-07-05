import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

import User from '../models/User';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { decodeToken } from '../utils/decodeToken';

interface CustomRequest extends Request {
  userId?: string;
}

const protect = asyncHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError(401, errors.INVALID_TOKEN);
    }

    const token = header.split(' ')[1];
    const { userId } = decodeToken(token);

    if (!(await User.exists({ _id: userId })))
      throw new AppError(401, errors.USER_NOT_FOUND);

    req.userId = userId;

    next();
  },
);

export default protect;
