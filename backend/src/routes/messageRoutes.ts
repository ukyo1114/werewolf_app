import express from 'express';
import { param, body, query } from 'express-validator';

import { validation, errors } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import {
  getIndex,
  getMessages,
  sendMessage,
} from '../controllers/messageController';
import protect from '../middleware/protect';

const validateChannelId = param('channelId')
  .isMongoId()
  .withMessage(validation.INVALID_CHANNEL_ID);

const validateMessageId = query('messageId')
  .optional()
  .isMongoId()
  .withMessage(validation.INVALID_MESSAGE_ID);

const validateIndex = body('index')
  .isArray()
  .withMessage(errors.MESSAGE_NOT_FOUND);

const validateMessage = body('message')
  .trim()
  .isString()
  .isLength({ min: 1, max: 400 })
  .withMessage(validation.MESSAGE_LENGTH)
  .escape();

const validateReplyTo = body('replyTo')
  .optional()
  .isMongoId()
  .withMessage(validation.INVALID_MESSAGE_ID);

const router = express.Router();

router.use(protect);

router.get('/index/:channelId', [validateChannelId], validateRequest, getIndex);

router.get(
  '/messages/:channelId',
  [validateChannelId, validateMessageId, validateIndex],
  validateRequest,
  getMessages,
);

router.post(
  '/:channelId',
  [validateChannelId, validateMessage, validateReplyTo],
  validateRequest,
  sendMessage,
);

export default router;
