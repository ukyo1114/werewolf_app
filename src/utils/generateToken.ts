import jwt from 'jsonwebtoken';
import { errors } from '../config/messages';

interface VerificationTokenPayload {
  email: string;
  action: string;
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error(errors.JWT_SECRET_NOT_DEFINED);

export const genUserToken = (userId: string): string => {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '30d' });
};

export const genVerificationToken = ({
  email,
  action,
}: VerificationTokenPayload): string => {
  const payload = { email, action };
  return jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
};
