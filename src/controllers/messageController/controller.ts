import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import Message, { MessageType } from '../../models/messageModel';
import { appState, Events } from '../../app';

const { channelManagers } = appState;
const { channelEvents } = Events;

interface CustomRequest<TBody = {}, TParams = {}, TQuery = {}>
  extends Request<TParams, any, TBody, TQuery> {
  userId?: string;
}

export const getMessages = asyncHandler(
  async (
    req: CustomRequest<{}, { channelId: string }, { messageId?: string }>,
    res: Response,
  ): Promise<void> => {
    const { userId } = req as { userId: string };
    const { channelId } = req.params;
    const { messageId } = req.query;

    const channel = channelManagers[channelId];
    if (!channel) throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);

    const query: {
      _id?: { $ne: string };
      channelId: string;
      messageType?: { $in: MessageType[] };
      createdAt?: { $lte: Date };
    } = {
      channelId,
    };

    const messageType = channel.getReceiveMessageType(userId);
    if (messageType) query.messageType = messageType;

    if (messageId) {
      const message = await Message.findById(messageId)
        .select('createdAt')
        .lean();
      if (!message) throw new AppError(404, errors.MESSAGE_NOT_FOUND);

      query._id = { $ne: messageId };
      query.createdAt = { $lte: message.createdAt };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json(messages);
  },
);

export const sendMessage = asyncHandler(
  async (
    req: CustomRequest<{ message: string }, { channelId: string }>,
    res: Response,
  ): Promise<void> => {
    const { userId } = req as { userId: string };
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

    channelEvents.emit('newMessage', channelId, newMessage, messageReceivers);

    res.status(200).send();
  },
);
