import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from './AppError';
import { errors } from '../config/messages';

const decodeToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    return decoded as JwtPayload;
  } catch (error) {
    throw new AppError(401, errors.INVALID_TOKEN);
  }
};

export default decodeToken;
