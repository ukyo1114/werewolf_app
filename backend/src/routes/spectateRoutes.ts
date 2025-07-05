import express from 'express';
import { param } from 'express-validator';

import { validation } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import { getGameList } from '../controllers/spectateController/controller';
import protect from '../middleware/protect';

const validateChannelId = param('channelId')
  .isMongoId()
  .withMessage(validation.INVALID_CHANNEL_ID);

const router = express.Router();

router.use(protect);

router.get('/:channelId', [validateChannelId], validateRequest, getGameList);

export default router;
