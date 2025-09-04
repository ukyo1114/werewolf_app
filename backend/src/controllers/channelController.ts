import { Response } from 'express';
import asyncHandler from 'express-async-handler';

import {
  CustomRequest,
  ICreateChannel,
  IChannelSettings,
} from '../config/types';
import { channelService } from '../services/channel/services';

export const getChannelList = asyncHandler(
  async (req: CustomRequest, res: Response): Promise<void> => {
    const userId = req.userId as string;
    const data = await channelService.getChannelList(userId);
    res.status(200).json(data);
  },
);

export const createChannel = asyncHandler(
  async (req: CustomRequest<ICreateChannel>, res: Response): Promise<void> => {
    const {
      channelName,
      channelDescription,
      passwordEnabled,
      password,
      denyGuests,
      numberOfPlayers,
    } = req.body;
    const userId = req.userId as string;
    const channelData = {
      channelName,
      channelDescription,
      passwordEnabled,
      password: passwordEnabled ? password : undefined,
      channelAdmin: userId,
      denyGuests,
      numberOfPlayers,
    };
    const channelId = await channelService.createChannel(userId, channelData);
    res.status(201).json({ channelId });
  },
);

export const updateChannelSettings = asyncHandler(
  async (
    req: CustomRequest<IChannelSettings, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const {
      channelName,
      channelDescription,
      passwordEnabled,
      password,
      denyGuests,
      numberOfPlayers,
    } = req.body;
    const userId = req.userId as string;

    const data = {
      channelName: channelName || '',
      channelDescription: channelDescription || '',
      passwordEnabled,
      password: password || '',
      denyGuests,
      numberOfPlayers,
    };
    await channelService.updateChannelSettings(userId, channelId, data);
    res.status(200).send();
  },
);

export const joinChannel = asyncHandler(
  async (
    req: CustomRequest<{ password?: string }, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const { password } = req.body;
    const userId = req.userId as string;

    const data = await channelService.joinChannel(userId, channelId, password);

    res.status(200).json(data);
  },
);

export const leaveChannel = asyncHandler(
  async (
    req: CustomRequest<unknown, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const userId = req.userId as string;

    await channelService.leaveChannel(channelId, userId);
    res.status(200).send();
  },
);

export const deleteChannel = asyncHandler(
  async (
    req: CustomRequest<unknown, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const userId = req.userId as string;
    await channelService.deleteChannel(channelId, userId);
    res.status(200).send();
  },
);
