import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { gameService } from '../services/game/services';
import { CustomRequest } from '../config/types';

export const getGameList = asyncHandler(
  async (
    req: CustomRequest<{}, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { userId } = req as { userId: string };
    const { channelId } = req.params;

    const gameList = await gameService.getGameList(userId, channelId);

    res.status(200).json(gameList);
  },
);
