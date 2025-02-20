import express from 'express';
import { param, body } from 'express-validator';

import { validation } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import {
  getChannelList,
  createChannel,
  updateChannelSettings,
  joinChannel,
  leaveChannel,
} from '../controllers/channelController/controller';
import protect from '../middleware/protect';

const validateChannelId = param('channelId')
  .optional()
  .isMongoId()
  .withMessage(validation.INVALID_CHANNEL_ID);

const validateChannelNameRequired = body('channelName')
  .exists()
  .trim()
  .isString()
  .isLength({ min: 1, max: 20 })
  .withMessage(validation.CHANNEL_NAME_LENGTH)
  .escape();

const validateChannelNameOptional = body('channelName')
  .trim()
  .optional()
  .isString()
  .isLength({ min: 1, max: 20 })
  .withMessage(validation.CHANNEL_NAME_LENGTH)
  .escape();

const validateChannelDescriptionRequired = body('channelDescription')
  .exists()
  .trim()
  .isString()
  .isLength({ min: 1, max: 2000 })
  .withMessage(validation.CHANNEL_DESCRIPTION_LENGTH)
  .escape();

const validateChannelDescriptionOptional = body('channelDescription')
  .trim()
  .optional()
  .isString()
  .isLength({ min: 1, max: 2000 })
  .withMessage(validation.CHANNEL_DESCRIPTION_LENGTH)
  .escape();

const validatePasswordEnabled = body('passwordEnabled')
  .exists()
  .isBoolean()
  .toBoolean();

const validatePassword = body('password')
  .trim()
  .optional()
  .isString()
  .isLength({ min: 8, max: 64 })
  .withMessage(validation.PASSWORD_LENGTH);

const validateDenyGuests = body('denyGuests')
  .optional()
  .isBoolean()
  .toBoolean();

const router = express.Router();

router.use(protect);

router.get('/list', getChannelList);

router.post(
  '/create',
  [
    validateChannelNameRequired,
    validateChannelDescriptionRequired,
    validatePasswordEnabled,
    validatePassword,
    validateDenyGuests,
  ],
  validateRequest,
  createChannel,
);

router.put(
  '/settings/:channelId',
  [
    validateChannelNameOptional,
    validateChannelDescriptionOptional,
    validatePasswordEnabled,
    validatePassword,
    validateDenyGuests,
  ],
  validateRequest,
  updateChannelSettings,
);

router.put(
  '/join',
  [validateChannelId, validatePassword],
  validateRequest,
  joinChannel,
);

router.delete('/leave', [validateChannelId], validateRequest, leaveChannel);

export default router;
