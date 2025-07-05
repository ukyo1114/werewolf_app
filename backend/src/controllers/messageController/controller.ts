import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import Message from '../../models/Message';
import { appState, Events } from '../../app';
import { CustomRequest } from '../../config/types';

const { channelManagers } = appState;
const { channelEvents } = Events;

export const getMessages = asyncHandler(
  async (
    req: CustomRequest<{}, { channelId: string }, { messageId?: string }>,
    res: Response,
  ): Promise<void> => {
    const userId = req.userId as string;
    const { channelId } = req.params;
    const messageId = req.query.messageId;

    const channel = channelManagers[channelId];
    if (!channel) throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);
    const messageType = channel.getReceiveMessageType(userId);

    const messages = await Message.getMessages({
      channelId,
      messageId,
      messageType,
    });

    res.status(200).json(messages);
  },
);

export const sendMessage = asyncHandler(
  async (
    req: CustomRequest<{ message: string }, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const userId = req.userId as string;
    const { channelId } = req.params;
    const { message } = req.body;

    const channel = channelManagers[channelId];
    if (!channel) throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);

    const messageType = channel.getSendMessageType(userId);
    const messageReceivers = channel.getMessageReceivers(messageType);

    const newMessage = await Message.create({
      channelId,
      userId,
      message,
      messageType,
    });

    channelEvents.emit(
      'newMessage',
      channelId,
      newMessage.toObject(),
      messageReceivers,
    );
    res.status(200).send();
  },
);
