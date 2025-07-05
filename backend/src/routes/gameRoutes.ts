import express from 'express';
import { param, body } from 'express-validator';
import { validation } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import {
  joinGame,
  handleGameAction,
} from '../controllers/gameController/controller';
import protect from '../middleware/protect';

const validateGameId = param('gameId')
  .isMongoId()
  .withMessage(validation.INVALID_GAME_ID);

const validateSelectedUser = body('selectedUser')
  .isMongoId()
  .withMessage(validation.INVALID_SELECTED_USER);

const router = express.Router();

const getRoute = (route: string, actionKey: string) => {
  router.get(
    `${route}/:gameId`,
    [validateGameId],
    validateRequest,
    handleGameAction(actionKey),
  );
};

const postRoute = (route: string, actionKey: string) => {
  router.post(
    `${route}/:gameId`,
    [validateGameId, validateSelectedUser],
    validateRequest,
    handleGameAction(actionKey),
  );
};

router.use(protect);

router.get('/join/:gameId', [validateGameId], validateRequest, joinGame);
getRoute('/player-state', 'playerState');
postRoute('/vote', 'vote');
postRoute('/devine', 'devineRequest');
postRoute('/guard', 'guardRequest');
postRoute('/attack', 'attackRequest');
getRoute('/vote-history', 'voteHistory');
getRoute('/devine-result', 'devineResult');
getRoute('/medium-result', 'mediumResult');
getRoute('/guard-history', 'guardHistory');
getRoute('/attack-history', 'attackHistory');

export default router;
