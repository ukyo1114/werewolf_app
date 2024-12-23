import jwt from 'jsonwebtoken';
// import { errors } from '../config/messages';

interface VerificationTokenPayload {
  userId: string;
  email: string;
  action?: string;
}

// const jwtSecret = process.env.JWT_SECRET;
// if (!jwtSecret) throw new Error(errors.JWT_SECRET_NOT_DEFINED);

export const genUserToken = (userId: string, secret: string): string => {
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
};

export const genVerificationToken = (
  { userId, email, action = 'verifyEmail' }: VerificationTokenPayload,
  secret: string,
): string => {
  const payload = { userId, email, action };
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};
