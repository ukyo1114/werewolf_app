import User from '../models/userModel';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

export const checkUserGuest = async (userId: string): Promise<boolean> => {
  const user = await User.findById(userId).select('isGuest').lean();
  if (!user) throw new AppError(404, errors.USER_NOT_FOUND);

  return user.isGuest;
};
