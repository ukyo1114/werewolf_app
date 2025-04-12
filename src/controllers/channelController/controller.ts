import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import AppError from '../../utils/AppError';
import { errors, validation } from '../../config/messages';
import Channel from '../../models/channelModel';
import ChannelUser from '../../models/channelUserModel';
import ChannelBlockUser from '../../models/channelBlockUserModel';
import { checkChannelAdmin } from '../../utils/checkChannelAdmin';
import { checkUserGuest } from '../../utils/checkUserGuest';
import {
  CustomRequest,
  ICreateChannel,
  IChannelSettings,
} from '../../config/types';

export const getChannelList = asyncHandler(
  async (req: CustomRequest, res: Response): Promise<void> => {
    const { userId } = req as { userId: string };

    const channelList = await Channel.find({})
      .select('-password')
      .populate('channelAdmin', '_id name pic')
      .lean();

    if (channelList.length === 0)
      throw new AppError(404, errors.CHANNEL_NOT_FOUND);

    const joinedChannels = await ChannelUser.find({ userId })
      .select('channelId')
      .lean();

    const blockedChannels = await ChannelBlockUser.find({ userId })
      .select('channelId')
      .lean();

    res.status(200).json({
      channelList,
      joinedChannels: joinedChannels.map((channel) => channel.channelId),
      blockedChannels: blockedChannels.map((channel) => channel.channelId),
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
    const { userId } = req as { userId: string };

    const isUserGuest = await checkUserGuest(userId);
    if (isUserGuest)
      throw new AppError(403, errors.GUEST_CREATE_CHANNEL_DENIED);

    if (passwordEnabled && !password)
      throw new AppError(400, validation.PASSWORD_LENGTH);

    const createdChannel = await Channel.create({
      channelName,
      channelDescription,
      passwordEnabled,
      password: passwordEnabled ? password : undefined,
      channelAdmin: userId,
      denyGuests,
      numberOfPlayers,
    });

    await ChannelUser.create({
      channelId: createdChannel._id,
      userId,
    });

    const channel = await Channel.findById(createdChannel._id)
      .select('-passwordEnabled -password -denyGuests')
      .lean();

    res.status(201).json(channel);
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
    const { userId } = req as { userId: string };

    const isChannelAdmin = await checkChannelAdmin(channelId, userId);
    if (!isChannelAdmin) throw new AppError(403, errors.PERMISSION_DENIED);

    const channel = await Channel.findById(channelId);
    if (!channel) throw new AppError(404, errors.CHANNEL_NOT_FOUND);

    if (channelName) channel.channelName = channelName;
    if (channelDescription) channel.channelDescription = channelDescription;
    if (!passwordEnabled) {
      channel.passwordEnabled = false;
    } else if (!channel.passwordEnabled && password) {
      channel.passwordEnabled = true;
    }
    if (passwordEnabled && password) channel.password = password;
    channel.denyGuests = denyGuests;
    channel.numberOfPlayers = numberOfPlayers;

    await channel.save();

    /* const updatedChannel = await Channel.findById(channelId)
      .select('channelName channelDescription')
      .lean();

    channelEvents.emit('channelSettingsUpdated', { channelId, updatedChannel }); */

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
    const { userId } = req as { userId: string };

    const isUserBlocked = await ChannelBlockUser.findOne({ channelId, userId });
    if (isUserBlocked) throw new AppError(403, errors.USER_BLOCKED);

    const channel = await Channel.findById(channelId);
    if (!channel) throw new AppError(404, errors.CHANNEL_NOT_FOUND);

    const isUserInChannel = await ChannelUser.findOne({ channelId, userId });

    if (!isUserInChannel) {
      if (channel.denyGuests && (await checkUserGuest(userId))) {
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

    const users = await ChannelUser.find({ channelId })
      .select('userId')
      .populate('userId', '_id userName pic')
      .lean();

    const userList = users.map((user) => user.userId);

    // const user = await User.findById(userId).select("_id nam pic").lean();
    // channelEvents.emit("userJoined", { channelId, user });

    res.status(200).json({
      channelName: channel.channelName,
      channelDescription: channel.channelDescription,
      channelAdmin: channel.channelAdmin.toString(),
      users: userList,
    });
  },
);

export const leaveChannel = asyncHandler(
  async (
    req: CustomRequest<unknown, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { channelId } = req.params;
    const { userId } = req as { userId: string };

    const isChannelAdmin = await checkChannelAdmin(channelId, userId);
    if (isChannelAdmin) throw new AppError(403, errors.ADMIN_LEAVE_DENIED);

    const leftUser = await ChannelUser.findOneAndDelete({ channelId, userId });

    if (!leftUser) throw new AppError(400, errors.USER_ALREADY_LEFT);

    // channelEvents.emit("userLeft", { channelId, usrId });

    res.status(200).send();
  },
);
