import User from '../../src/models/userModel';
import { checkUserGuest } from '../../src/utils/checkUserGuest';

let guestUserId: string;
let authUserId: string;

beforeAll(async () => {
  const [guestUser, authUser] = await Promise.all([
    User.create({
      userName: 'guestUser',
      email: 'guestUser@example.com',
      password: 'guestUser',
    }),
    User.create({
      userName: 'authUser',
      email: 'authUser@example.com',
      password: 'authUser',
      isGuest: false,
    }),
  ]);

  guestUserId = guestUser._id.toString();
  authUserId = authUser._id.toString();
});

describe('test checkUserGuest', () => {
  it('ユーザーがゲストのときtrueを返す', async () => {
    const isUserGuest = await checkUserGuest(guestUserId);
    expect(isUserGuest).toBe(true);
  });

  it('ユーザーがゲストでないときfalseを返す', async () => {
    const isUserGuest = await checkUserGuest(authUserId);
    expect(isUserGuest).toBe(false);
  });

  it('ユーザーが存在しないときエラーを返す', async () => {
    await expect(() => checkUserGuest('notExist')).rejects.toThrow();
  });
});
