import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';
import ChannelBlockUser from '../../src/models/channelBlockUserModel';
import { mockUserId, mockChannelId } from '../../jest.setup';

beforeEach(async () => {
  await ChannelBlockUser.collection.dropIndexes(); // インデックスをリセット
  await ChannelBlockUser.syncIndexes(); // インデックスを適用
  await ChannelBlockUser.deleteMany({}); // データをクリア
});

afterEach(async () => {
  jest.clearAllMocks();
});

describe('ChannelBlockUser Model Test', () => {
  it('ブロックユーザーの登録に成功する', async () => {
    const channelBlockUser = await ChannelBlockUser.create({
      channelId: mockChannelId,
      userId: mockUserId,
    });

    expect(channelBlockUser.channelId.toString()).toBe(mockChannelId);
    expect(channelBlockUser.userId.toString()).toBe(mockUserId);
    expect(channelBlockUser.createdAt).toBeDefined();
    expect(channelBlockUser.updatedAt).toBeDefined();
  });

  it('ブロックユーザーを重複して登録しようとするとエラーになる', async () => {
    await ChannelBlockUser.create({
      channelId: mockChannelId,
      userId: mockUserId,
    });

    await expect(
      ChannelBlockUser.create({
        channelId: mockChannelId,
        userId: mockUserId,
      }),
    ).rejects.toThrow();
  });

  it('必須項目が未入力の場合、ブロックユーザーの登録に失敗する', async () => {
    const invalidData = {};

    await expect(ChannelBlockUser.create(invalidData)).rejects.toThrow();
  });
});
