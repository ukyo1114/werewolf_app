import { errors } from '../config/messages';

export const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error(errors.JWT_SECRET_NOT_DEFINED);
  return secret;
};
