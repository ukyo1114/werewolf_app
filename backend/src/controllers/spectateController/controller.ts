import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { createGameList } from './utils';
import { appState } from '../../app';
import { CustomRequest } from '../../config/types';

const { channelManagers } = appState;

export const getGameList = asyncHandler(
  async (
    req: CustomRequest<{}, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { userId } = req as { userId: string };
    const { channelId } = req.params;

    const channel = channelManagers[channelId];
    if (!channel) throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);
    channel.checkCanUserAccessChannel(userId);

    const gameList = await createGameList(channelId);

    res.status(200).json(gameList);
  },
);
