import express from 'express';
import { body } from 'express-validator';
import { validation } from '../config/messages';

import validateRequest from '../middleware/validateRequest';
// TODO: コントローラー関数をインポート

const router = express.Router();

const validateEmail = body('email')
  .isEmail()
  .withMessage(validation.INVALID_EMAIL)
  .trim()
  .normalizeEmail();

// TODO: トークンの検証を追加

router.post(
  '/register-user',
  [validateEmail],
  validateRequest,
  // sendVerificationEmail("registerUser")
);

router.post(
  '/change-email',
  [validateEmail], // TODO: トークンの検証を追加
  validateRequest,
  // sendVerificationEmail("change-email")
);

router.post(
  '/forgot-password',
  [validateEmail],
  validateRequest,
  // sendVerificationEmail("forgot-password")
);

export default router;
