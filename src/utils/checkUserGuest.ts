import User from '../models/userModel';

export const checkUserGuest = async (userId: string): Promise<boolean> => {
  const user = await User.findById(userId).select('isGuest').lean();
  if (!user) throw new Error();

  return user.isGuest;
};
