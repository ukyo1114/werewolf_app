import express from 'express';
import { body } from 'express-validator';
import { validation } from '../config/messages';

import validateRequest from '../middleware/validateRequest';
import { sendVerificationEmail } from '../controllers/verifyEmailController/controller';
import protect from '../middleware/protect';

const router = express.Router();

const validateEmail = body('email')
  .notEmpty()
  .isEmail()
  .withMessage(validation.INVALID_EMAIL)
  .trim()
  .normalizeEmail();

router.post(
  '/register-user',
  [validateEmail],
  validateRequest,
  sendVerificationEmail('registerUser'),
);

router.post(
  '/change-email',
  [validateEmail],
  validateRequest,
  protect,
  sendVerificationEmail('changeEmail'),
);

router.post(
  '/forgot-password',
  [validateEmail],
  validateRequest,
  sendVerificationEmail('forgotPassword'),
);

export default router;
