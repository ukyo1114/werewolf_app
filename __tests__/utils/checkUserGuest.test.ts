import User from '../../src/models/userModel';
import { checkUserGuest } from '../../src/utils/checkUserGuest';
import { mockUserId } from '../../jest.setup';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';

let guestUserId: string;
let authUserId: string;

beforeAll(async () => {
  const guestUser = await User.create({
    userName: 'guestUser',
    email: 'guestUser@example.com',
    password: 'guestUser',
  });

  const authUser = await User.create({
    userName: 'authUser',
    email: 'authUser@example.com',
    password: 'authUser',
    isGuest: false,
  });

  guestUserId = guestUser._id.toString();
  authUserId = authUser._id.toString();
});

describe('test checkUserGuest', () => {
  it('ユーザーがゲストのときtrueを返す', async () => {
    const isUserGuest = await checkUserGuest(guestUserId);

    expect(isUserGuest).toBe(true);
  });

  it('ユーザーがゲスト出ないときfalseを返す', async () => {
    const isUserGuest = await checkUserGuest(authUserId);

    expect(isUserGuest).toBe(false);
  });

  it('ユーザーが存在しないときエラーを返す', async () => {
    await expect(() => checkUserGuest(mockUserId)).rejects.toThrow(
      new AppError(404, errors.USER_NOT_FOUND),
    );
  });
});
