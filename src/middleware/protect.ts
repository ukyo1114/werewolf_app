import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

import User from '../models/userModel';
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
    const decoded = decodeToken(token);

    const user = await User.findById(decoded.userId).select('_id').lean();
    if (!user) throw new AppError(401, errors.USER_NOT_FOUND);

    req.userId = user._id.toString();

    next();
  },
);

export default protect;
