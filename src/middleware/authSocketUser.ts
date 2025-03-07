import { Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/userModel';
import Channel from '../models/channelModel';
import ChannelUser from '../models/channelUserModel';
import { errors } from '../config/messages';
import mongoose from 'mongoose';

export const authSocketUser = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  const { token, channelId } = socket.handshake.auth;
  if (!token) return next(new Error(errors.INVALID_TOKEN));
  if (!channelId) return next(new Error(errors.CHANNEL_ACCESS_FORBIDDEN));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const { userId } = decoded as JwtPayload;

    const userExists = await User.exists({ _id: userId });
    if (!userExists) return next(new Error(errors.USER_NOT_FOUND));

    const [channelExists, channelUserExists] = await Promise.all([
      Channel.exists({ _id: channelId }),
      ChannelUser.exists({ channelId, userId }),
    ]);
    if (!channelExists || !channelUserExists)
      return next(new Error(errors.CHANNEL_ACCESS_FORBIDDEN));

    (socket as any).userId = userId;
    (socket as any).channelId = channelId;
    next();
  } catch (error) {
    return next(new Error(errors.INVALID_TOKEN));
  }
};
