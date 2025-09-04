import jwt, { JwtPayload } from 'jsonwebtoken';
import { errors } from '../config/messages';
import { getSecret } from './getSecret';

export const decodeToken = (token: string): JwtPayload => {
  const secret = getSecret();

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error(errors.INVALID_TOKEN);
  }
};
