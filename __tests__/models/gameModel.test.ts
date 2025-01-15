import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';
import Game from '../../src/models/gameModel';

let userId: string;
let channelId: string;

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
});

beforeEach(async () => {
  jest.clearAllMocks();
  await Game.deleteMany({});
});

describe('Game Model Test', () => {
  it('ゲームの作成に成功する', async () => {
    const game = await Game.create({
      channelId,
    });

    expect(game.channelId.toString()).toBe(channelId);
    expect(game.createdAt).toBeDefined();
    expect(game.updatedAt).toBeDefined();
  });

  it('必須項目が未入力の場合、ユーザーの登録に失敗する', async () => {
    const invalidData = {};

    await expect(Game.create(invalidData)).rejects.toThrow();
  });
});
