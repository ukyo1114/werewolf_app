import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';
import ChannelBlockUser from '../../src/models/channelBlockUserModel';

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
  await ChannelBlockUser.deleteMany({});
});

describe('ChannelBlockUser Model Test', () => {
  it('ブロックユーザーの登録に成功する', async () => {
    const channelBlockUser = await ChannelBlockUser.create({
      channelId,
      userId,
    });

    expect(channelBlockUser.channelId.toString()).toBe(channelId);
    expect(channelBlockUser.userId.toString()).toBe(userId);
    expect(channelBlockUser.createdAt).toBeDefined();
    expect(channelBlockUser.updatedAt).toBeDefined();
  });

  it('ブロックユーザーを重複して登録しようとするとエラーになる', async () => {
    await ChannelBlockUser.create({
      channelId,
      userId,
    });

    await expect(
      ChannelBlockUser.create({
        channelId,
        userId,
      }),
    ).rejects.toThrow();
  });

  it('必須項目が未入力の場合、ブロックユーザーの登録に失敗する', async () => {
    const invalidData = {};

    await expect(ChannelBlockUser.create(invalidData)).rejects.toThrow();
  });
});
