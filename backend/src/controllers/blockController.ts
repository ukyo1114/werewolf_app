import { Response } from 'express';
import asyncHandler from 'express-async-handler';

import { CustomRequest, ISelectedUser } from '../config/types';
import { blockService } from '../services/block/services';

export const getBlockUserList = asyncHandler(
  async (
    req: CustomRequest<unknown, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const userId = req.userId as string;

    const blockUserList = await blockService.getBlockedUserList(
      userId,
      channelId,
    );
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

    await blockService.registerBlockUser(userId, selectedUser, channelId);
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

    await blockService.cancelBlock(userId, selectedUser, channelId);
    res.status(200).send();
  },
);
