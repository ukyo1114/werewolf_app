import { Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/userModel';
import { errors } from '../config/messages';

export const authSocketUser = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error(errors.INVALID_TOKEN));

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (!(await User.exists({ _id: userId })))
      return next(new Error(errors.USER_NOT_FOUND));

    (socket as any).userId = userId;
    next();
  } catch (error) {
    return next(new Error(errors.INVALID_TOKEN));
  }
};
