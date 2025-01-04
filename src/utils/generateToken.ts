import jwt from 'jsonwebtoken';
import { errors } from '../config/messages';

interface IVerificationTokenPayload {
  userId?: string;
  email: string;
  action: string;
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error(errors.JWT_SECRET_NOT_DEFINED);

export const genUserToken = (userId: string): string => {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '30d' });
};

export const genVerificationToken = ({
  userId,
  email,
  action,
}: IVerificationTokenPayload): string => {
  const payload = { userId, email, action };
  return jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
};
