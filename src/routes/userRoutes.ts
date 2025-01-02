import express from 'express';
import { body, param, ValidationChain } from 'express-validator';

import { errors, validation } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import {
  registerUser,
  login,
  updateProfile,
  changePassword,
  updateEmail,
} from '../controllers/userController/controller';
import protect from '../middleware/protect';

const router = express.Router();

const validateUserNameRequired = body('userName')
  .trim()
  .notEmpty()
  .isLength({ min: 1, max: 20 })
  .withMessage(validation.USER_NAME_LENGTH)
  .escape();

const validateUserNameOptional = body('userName')
  .trim()
  .optional()
  .isLength({ min: 1, max: 20 })
  .withMessage(validation.USER_NAME_LENGTH)
  .escape();

const validateEmail = body('email')
  .isEmail()
  .withMessage(validation.INVALID_EMAIL)
  .trim()
  .normalizeEmail();

const validatePassword = (password: string) =>
  body(password)
    .trim()
    .notEmpty()
    .isLength({ min: 8, max: 128 })
    .withMessage(validation.PASSWORD_LENGTH);

router.post(
  '/register',
  [validateUserNameRequired, validatePassword('password')],
  validateRequest,
  registerUser,
);

router.post(
  '/login',
  [validateEmail, validatePassword('password')],
  validateRequest,
  login,
);

router.put(
  '/profile',
  [validateUserNameOptional],
  validateRequest,
  protect,
  updateProfile,
);

router.get('/email/:token', updateEmail);

router.put(
  '/password',
  [validatePassword('newPassword')],
  validateRequest,
  protect,
  changePassword,
);

export default router;
