import jwt from 'jsonwebtoken';
import { getSecret } from './getSecret';

export type actionType = 'registerUser' | 'changeEmail' | 'forgotPassword';

export interface IVerificationTokenPayload {
  userId: string | null;
  email: string;
  action: actionType;
}

export const genUserToken = (userId: string): string => {
  const secret = getSecret();
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
};

export const genVerificationToken = (
  payload: IVerificationTokenPayload,
): string => {
  const secret = getSecret();
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};
