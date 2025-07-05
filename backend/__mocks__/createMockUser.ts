import User from '../src/models/User';
import { Types } from 'mongoose';

export const createMockUser = async () => {
  const mockUsers: Record<string, string> = {};

  for (let i = 0; i < 10; i++) {
    mockUsers[`mockUser${i}`] = new Types.ObjectId().toString();
  }

  // Promise.allを使用して全てのユーザー作成を待機
  await Promise.all(
    Object.entries(mockUsers).map(async ([key, userId]) => {
      await User.create({
        _id: userId,
        userName: key,
        isGuest: true,
      });
    }),
  );

  return mockUsers;
};
