import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../config/types';
import { messageService } from '../services/message/services';

export const getIndex = asyncHandler(
  async (
    req: CustomRequest<{}, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const userId = req.userId as string;
    const { channelId } = req.params;

    const index = await messageService.getIndex(channelId, userId);

    res.status(200).json(index);
  },
);

export const getMessages = asyncHandler(
  async (
    req: CustomRequest<{ index: string[] }, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const userId = req.userId as string;
    const { channelId } = req.params;
    const { index } = req.body;

    const messages = await messageService.getMessages(channelId, userId, index);

    res.status(200).json(messages);
  },
);

export const sendMessage = asyncHandler(
  async (
    req: CustomRequest<
      { message: string; replyTo?: string },
      { channelId: string }
    >,
    res: Response,
  ): Promise<void> => {
    const userId = req.userId as string;
    const { channelId } = req.params;
    const { message, replyTo } = req.body;

    await messageService.sendMessage(channelId, userId, message, replyTo);
    res.status(200).send();
  },
);
