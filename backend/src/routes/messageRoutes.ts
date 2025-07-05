import express from 'express';
import { param, body, query } from 'express-validator';

import { validation } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import {
  sendMessage,
  getMessages,
} from '../controllers/messageController/controller';
import protect from '../middleware/protect';

const validateChannelId = param('channelId')
  .isMongoId()
  .withMessage(validation.INVALID_CHANNEL_ID);

const validateMessageId = query('messageId')
  .optional()
  .isMongoId()
  .withMessage(validation.INVALID_MESSAGE_ID);

const validateMessage = body('message')
  .trim()
  .isString()
  .isLength({ min: 1, max: 400 })
  .withMessage(validation.MESSAGE_LENGTH)
  .escape();

const router = express.Router();

router.use(protect);

router.get(
  '/:channelId',
  [validateChannelId, validateMessageId],
  validateRequest,
  getMessages,
);

router.post(
  '/:channelId',
  [validateChannelId, validateMessage],
  validateRequest,
  sendMessage,
);

export default router;
