import express from 'express';
import { body } from 'express-validator';
import AppError from '../utils/AppError';
import { validation } from '../config/messages';
import validateRequest from '../middleware/validateRequest';
import {
  registerUser,
  login,
  updateProfile,
  updateEmail,
  changePassword,
  resetPassword,
  loginAsGuest,
} from '../controllers/userController/controller';
import protect from '../middleware/protect';

const router = express.Router();

const validateUserName = (isOptional: boolean) => {
  let validator = body('userName').trim();

  if (isOptional) {
    validator = validator.optional({ nullable: true });
  }

  return validator
    .isLength({ min: 1, max: 20 })
    .withMessage(validation.USER_NAME_LENGTH)
    .escape();
};

const validateEmail = body('email')
  .isEmail()
  .withMessage(validation.INVALID_EMAIL)
  .trim()
  .normalizeEmail();

const validatePic = body('pic')
  .optional({ nullable: true })
  .custom((value) => {
    if (!value) return true;

    // Check if it's a valid base64 image
    if (!value.match(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/)) {
      throw new Error(validation.INVALID_PIC);
    }

    // Check file size (1MB = 1 * 1024 * 1024 bytes)
    const base64Data = value.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 1 * 1024 * 1024) {
      throw new Error(validation.PIC_SIZE);
    }

    return true;
  });

const validatePassword = (password: string) =>
  body(password)
    .trim()
    .isLength({ min: 8, max: 64 })
    .withMessage(validation.PASSWORD_LENGTH);

router.post(
  '/register',
  [validateUserName(false), validatePassword('password')],
  validateRequest,
  registerUser,
);

router.post(
  '/login',
  [validateEmail, validatePassword('password')],
  validateRequest,
  login,
);

router.get('/guest', loginAsGuest);

router.put(
  '/profile',
  [validateUserName(true), validatePic],
  validateRequest,
  protect,
  updateProfile,
);

router.get('/email/:token', updateEmail);

router.put(
  '/password',
  [validatePassword('currentPassword'), validatePassword('newPassword')],
  validateRequest,
  protect,
  changePassword,
);

router.put(
  '/reset-password',
  [validatePassword('password')],
  validateRequest,
  resetPassword,
);

export default router;
