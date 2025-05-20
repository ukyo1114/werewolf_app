import jwt, { JwtPayload } from 'jsonwebtoken';
import { errors } from '../config/messages';

export const decodeToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error(errors.INVALID_TOKEN);
  }
};
