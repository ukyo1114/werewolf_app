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
  .isMongoId()
  .withMessage(validation.INVALID_CHANNEL_ID);

const validateChannelName = (isOptional: boolean) => {
  let validator = body('channelName').trim();
  if (isOptional) validator = validator.optional({ nullable: true });

  return validator
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage(validation.CHANNEL_NAME_LENGTH)
    .escape();
};

const validateChannelDescription = (isOptional: boolean) => {
  let validator = body('channelDescription').trim();
  if (isOptional) validator = validator.optional({ nullable: true });

  return validator
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage(validation.CHANNEL_DESCRIPTION_LENGTH)
    .escape();
};

const validatePasswordEnabled = body('passwordEnabled')
  .exists()
  .isBoolean()
  .toBoolean();

const validatePassword = body('password')
  .trim()
  .optional({ nullable: true })
  .isString()
  .isLength({ min: 8, max: 64 })
  .withMessage(validation.PASSWORD_LENGTH);

const validateDenyGuests = body('denyGuests')
  .optional()
  .isBoolean()
  .toBoolean();

const validateNumberOfPlayers = body('numberOfPlayers')
  .isInt({ min: 5, max: 20 })
  .withMessage(validation.NUMBER_OF_PLAYERS);

const router = express.Router();

router.use(protect);

router.get('/list', getChannelList);

router.post(
  '/create',
  [
    validateChannelName(false),
    validateChannelDescription(false),
    validatePasswordEnabled,
    validatePassword,
    validateDenyGuests,
    validateNumberOfPlayers,
  ],
  validateRequest,
  createChannel,
);

router.put(
  '/settings/:channelId',
  [
    validateChannelId,
    validateChannelName(true),
    validateChannelDescription(true),
    validatePasswordEnabled,
    validatePassword,
    validateDenyGuests,
    validateNumberOfPlayers,
  ],
  validateRequest,
  updateChannelSettings,
);

router.put(
  '/join/:channelId',
  [validateChannelId, validatePassword],
  validateRequest,
  joinChannel,
);

router.delete(
  '/leave/:channelId',
  [validateChannelId],
  validateRequest,
  leaveChannel,
);

export default router;
