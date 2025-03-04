import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';
import ChannelUser from '../../src/models/channelUserModel';
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
    passwordEnabled: true,
    password: 'securepassword',
    channelAdmin: userId,
  });
  channelId = channel._id.toString();
});

beforeEach(async () => {
  await ChannelUser.collection.dropIndexes();
  await ChannelUser.syncIndexes();
  await ChannelUser.deleteMany({});
});

afterEach(async () => {
  jest.clearAllMocks();
});

describe('ChannelUser Model Test', () => {
  it('ユーザーの登録に成功する', async () => {
    const channelUser = await ChannelUser.create({
      channelId,
      userId,
    });

    expect(channelUser.channelId.toString()).toBe(channelId);
    expect(channelUser.userId.toString()).toBe(userId);
    expect(channelUser.createdAt).toBeDefined();
    expect(channelUser.updatedAt).toBeDefined();
  });

  it('ユーザーを重複して登録しようとするとエラーになる', async () => {
    await ChannelUser.create({
      channelId,
      userId,
    });

    await expect(
      ChannelUser.create({
        channelId,
        userId,
      }),
    ).rejects.toThrow();
  });

  it('必須項目が未入力の場合、ユーザーの登録に失敗する', async () => {
    const invalidData = {};

    await expect(ChannelUser.create(invalidData)).rejects.toThrow();
  });
});
