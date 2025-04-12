import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import ChannelBlockUser from '../../models/channelBlockUserModel';
import { checkChannelAdmin } from '../../utils/checkChannelAdmin';
import { CustomRequest, ISelectedUser } from '../../config/types';

export const getBlockUserList = asyncHandler(
  async (
    req: CustomRequest<unknown, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const { userId } = req as { userId: string };

    const isChannelAdmin = await checkChannelAdmin(channelId, userId);
    if (!isChannelAdmin) throw new AppError(403, errors.PERMISSION_DENIED);

    const blockUsers = await ChannelBlockUser.find({ channelId })
      .populate('userId', '_id userName pic')
      .lean();

    const blockUserList = blockUsers.map((blockUser) => blockUser.userId);

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
    const { userId } = req as { userId: string };

    if (selectedUser === userId)
      throw new AppError(403, errors.DENIED_SELF_BLOCK);

    const isChannelAdmin = await checkChannelAdmin(channelId, userId);
    if (!isChannelAdmin) throw new AppError(403, errors.PERMISSION_DENIED);

    try {
      await ChannelBlockUser.create({
        channelId,
        userId: selectedUser,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(400, errors.USER_ALREADY_BLOCKED);
      } else throw error;
    }

    // channelEvents.emit("registerBlockUser", { channelId, selectedUser });

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
    const { userId } = req as { userId: string };

    const isChannelAdmin = await checkChannelAdmin(channelId, userId);
    if (!isChannelAdmin) throw new AppError(403, errors.PERMISSION_DENIED);

    const blockedUser = await ChannelBlockUser.findOneAndDelete({
      channelId,
      userId: selectedUser,
    });
    if (!blockedUser) throw new AppError(404, errors.USER_NOT_BLOCKED);

    // channelEvents.emit("cancelBlockUser", { channelId, selectedUser });

    res.status(200).send();
  },
);
