import jwt from 'jsonwebtoken';
import { errors } from '../config/messages';

type actionType = 'registerUser' | 'changeEmail' | 'forgotPassword';

export interface IVerificationTokenPayload {
  userId?: string;
  email: string;
  action: actionType;
}

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error(errors.JWT_SECRET_NOT_DEFINED);

export const genUserToken = (userId: string): string => {
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
};

export const genVerificationToken = (
  payload: IVerificationTokenPayload,
): string => {
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};
