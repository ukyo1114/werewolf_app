import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';
import Game from '../../src/models/gameModel';
import GameUser from '../../src/models/gameUserModel';

let userId: string;
let channelId: string;
let gameId: string;

beforeAll(async () => {
  const user = await User.create({
    userName: 'testUser',
    email: 'already-registered@example.com',
    password: 'password123',
    pic: null,
  });
  userId = user._id.toString();

  const channel = await Channel.create({
    channelName: 'testChannel',
    channelDescription: 'testDescription',
    password_enabled: true,
    password: 'securepassword',
    channelAdmin: userId,
  });
  channelId = channel._id.toString();

  const game = await Game.create({
    channelId,
  });
  gameId = game._id.toString();
});

beforeEach(async () => {
  jest.clearAllMocks();
  await GameUser.deleteMany({});
});

describe('GameUser Model Test', () => {
  it('ユーザーの登録に成功する', async () => {
    const gameUser = await GameUser.create({
      gameId,
      userId,
    });

    expect(gameUser.gameId.toString()).toBe(gameId);
    expect(gameUser.userId.toString()).toBe(userId);
    expect(gameUser.role).toBe('spectator');
    expect(gameUser.createdAt).toBeDefined();
    expect(gameUser.updatedAt).toBeDefined();
  });

  it('必須項目が未入力の場合、ユーザーの登録に失敗する', async () => {
    const invalidData = {};

    await expect(GameUser.create(invalidData)).rejects.toThrow();
  });
});
