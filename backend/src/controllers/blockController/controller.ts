import { Response } from 'express';
import asyncHandler from 'express-async-handler';

import { errors } from '../../config/messages';
import AppError from '../../utils/AppError';
import { Events } from '../../app';
import Channel from '../../models/Channel';
import ChannelBlockUser from '../../models/ChannelBlockUser';
import { CustomRequest, ISelectedUser } from '../../config/types';

const { channelEvents } = Events;

export const getBlockUserList = asyncHandler(
  async (
    req: CustomRequest<unknown, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const userId = req.userId as string;
    const isAdmin = await Channel.isChannelAdmin(channelId, userId);
    if (!isAdmin) throw new AppError(403, errors.PERMISSION_DENIED);
    const blockUserList = await ChannelBlockUser.getBlockedUsers(channelId);

    res.status(200).send(blockUserList);
  },
);

export const registerBlockUser = asyncHandler(
  async (
    req: CustomRequest<ISelectedUser, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const { selectedUser } = req.body;
    const userId = req.userId as string;
    if (selectedUser === userId)
      throw new AppError(403, errors.DENIED_SELF_BLOCK);
    const isAdmin = await Channel.isChannelAdmin(channelId, userId);
    if (!isAdmin) throw new AppError(403, errors.PERMISSION_DENIED);
    await ChannelBlockUser.addBlockUser(channelId, selectedUser);

    channelEvents.emit('registerBlockUser', {
      channelId,
      userId: selectedUser,
    });
    res.status(200).send();
  },
);

export const cancelBlock = asyncHandler(
  async (
    req: CustomRequest<ISelectedUser, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const { selectedUser } = req.body;
    const userId = req.userId as string;
    const isAdmin = await Channel.isChannelAdmin(channelId, userId);
    if (!isAdmin) throw new AppError(403, errors.PERMISSION_DENIED);
    const result = await ChannelBlockUser.unblockUser(channelId, selectedUser);
    if (!result) throw new AppError(404, errors.USER_NOT_BLOCKED);

    channelEvents.emit('cancelBlockUser', { channelId, userId: selectedUser });
    res.status(200).send();
  },
);
