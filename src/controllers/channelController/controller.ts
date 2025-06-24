import { Response } from 'express';
import asyncHandler from 'express-async-handler';

import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { Events } from '../../app';
import User from '../../models/User';
import Channel from '../../models/Channel';
import ChannelUser from '../../models/ChannelUser';
import ChannelBlockUser from '../../models/ChannelBlockUser';
import {
  CustomRequest,
  ICreateChannel,
  IChannelSettings,
} from '../../config/types';

const { channelEvents } = Events;

export const getChannelList = asyncHandler(
  async (req: CustomRequest, res: Response): Promise<void> => {
    const userId = req.userId as string;
    const [channelList, joinedChannels, blockedChannels] = await Promise.all([
      Channel.getChannelList(),
      ChannelUser.getParticipantingChannels(userId),
      ChannelBlockUser.getBlockedChannels(userId),
    ]);

    res.status(200).json({
      channelList,
      joinedChannels,
      blockedChannels,
    });
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
    // ゲストユーザーはチャンネルを作成できない
    const isUserGuest = await User.isGuestUser(userId);
    if (isUserGuest)
      throw new AppError(403, errors.GUEST_CREATE_CHANNEL_DENIED);
    // チャンネルを作成
    const createdChannel = await Channel.create({
      channelName,
      channelDescription,
      passwordEnabled,
      password: passwordEnabled ? password : undefined,
      channelAdmin: userId,
      denyGuests,
      numberOfPlayers,
    });

    try {
      await ChannelUser.create({
        channelId: createdChannel._id,
        userId,
      });
    } catch (error) {
      await Channel.findByIdAndDelete(createdChannel._id);
      throw error;
    }

    res.status(201).json({ channelId: createdChannel._id });
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
    const [
      updatedChannelName,
      updatedChannelDescription,
      updatedNumberOfPlayers,
    ] = await Channel.updateChannelSettings({
      userId,
      channelId,
      channelName,
      channelDescription,
      passwordEnabled,
      password,
      denyGuests,
      numberOfPlayers,
    });

    const data = {
      channelId,
      channelName: updatedChannelName,
      channelDescription: updatedChannelDescription,
      numberOfPlayers: updatedNumberOfPlayers,
    };
    channelEvents.emit('channelSettingsUpdated', data);
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

    const isUserBlocked = await ChannelBlockUser.isUserBlocked(
      channelId,
      userId,
    );
    if (isUserBlocked) throw new AppError(403, errors.USER_BLOCKED);

    const channel = await Channel.findById(channelId);
    if (!channel) throw new AppError(404, errors.CHANNEL_NOT_FOUND);

    const isUserInChannel = await ChannelUser.isUserInChannel(
      channelId,
      userId,
    );

    if (!isUserInChannel) {
      if (channel.denyGuests && (await User.isGuestUser(userId))) {
        throw new AppError(403, errors.GUEST_ENTRY_DENIED);
      }

      if (
        channel.passwordEnabled &&
        (!password || !(await channel.matchPassword(password)))
      ) {
        throw new AppError(401, errors.WRONG_PASSWORD);
      } else {
        await ChannelUser.create({ channelId, userId });
      }
    }

    const [channelUsers, user] = await Promise.all([
      ChannelUser.getChannelUsers(channelId),
      User.findById(userId).select('_id userName pic isGuest').lean(),
    ]);

    if (!isUserInChannel) {
      channelEvents.emit('userJoined', { channelId, user });
    }

    res.status(200).json({
      channelName: channel.channelName,
      channelDescription: channel.channelDescription,
      channelAdmin: channel.channelAdmin.toString(),
      channelUsers,
      numberOfPlayers: channel.numberOfPlayers,
    });
  },
);

export const leaveChannel = asyncHandler(
  async (
    req: CustomRequest<unknown, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const userId = req.userId as string;

    const isChannelAdmin = await Channel.isChannelAdmin(channelId, userId);
    if (isChannelAdmin) throw new AppError(403, errors.ADMIN_LEAVE_DENIED);

    const result = await ChannelUser.leaveChannel(channelId, userId);
    if (!result) throw new AppError(400, errors.USER_ALREADY_LEFT);

    channelEvents.emit('userLeft', { channelId, userId });
    res.status(200).send();
  },
);
