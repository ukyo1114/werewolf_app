import express from 'express';
import { param, body } from 'express-validator';

import { validation } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import {
  getBlockUserList,
  registerBlockUser,
  cancelBlock,
} from '../controllers/blockController/controller';
import protect from '../middleware/protect';

const validateChannelId = param('channelId')
  .optional()
  .isMongoId()
  .withMessage(validation.INVALID_CHANNEL_ID);

const validateSelectedUser = body('selectedUser')
  .isMongoId()
  .withMessage(validation.INVALID_SELECTED_USER);

const router = express.Router();

router.use(protect);

router.get(
  '/list/:channelId',
  [validateChannelId],
  validateRequest,
  getBlockUserList,
);

router.post(
  '/register/:channelId',
  [validateChannelId, validateSelectedUser],
  validateRequest,
  registerBlockUser,
);

router.delete(
  '/cancel/:channelId',
  [validateChannelId, validateSelectedUser],
  validateRequest,
  cancelBlock,
);

export default router;
