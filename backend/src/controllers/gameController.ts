import { Response, RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';

import { CustomRequest } from '../config/types';
import { gameService } from '../services/game/services';
import { actionMap } from '../services/game/interfaces';

export const joinGame = asyncHandler(
  async (
    req: CustomRequest<unknown, { gameId: string }>,
    res: Response,
  ): Promise<void> => {
    const userId = req.userId as string;
    const { gameId } = req.params;

    const data = await gameService.joinGame(gameId, userId);
    res.status(200).json(data);
  },
);

export const handleGameAction = (
  actionKey: keyof typeof actionMap,
): RequestHandler<{ gameId: string }, any, { selectedUser: string }> =>
  asyncHandler(
    async (
      req: CustomRequest<{ selectedUser: string }, { gameId: string }>,
      res: Response,
    ): Promise<void> => {
      const { userId } = req as { userId: string };
      const { gameId } = req.params;
      const { selectedUser } = req.body;

      const result = await gameService.handleGameAction(
        gameId,
        userId,
        actionKey,
        selectedUser,
      );

      result ? res.status(200).json(result) : res.status(200).send();
    },
  );
