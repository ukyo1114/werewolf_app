import Channel from '../../src/models/channelModel';
import { checkChannelAdmin } from '../../src/utils/checkChannelAdmin';
import { mockChannelId, mockUserId } from '../../jest.setup';

let testChannelId: string;

beforeAll(async () => {
  const channel = await Channel.create({
    channelName: 'test',
    channelDescription: 'test',
    channelAdmin: mockUserId,
  });

  testChannelId = channel._id.toString();
});

describe('test checkChannelAdmin', () => {
  it('ユーザーが管理者のときtrueを返す', async () => {
    const isChannelAdmin = await checkChannelAdmin(testChannelId, mockUserId);
    expect(isChannelAdmin).toBe(true);
  });

  it('ユーザーが管理者でないときfalseを返す', async () => {
    const isChannelAdmin = await checkChannelAdmin(testChannelId, 'notExist');
    expect(isChannelAdmin).toBe(false);
  });

  it('チャンネルが見つからないときエラーを返す', async () => {
    await expect(() =>
      checkChannelAdmin(mockChannelId, mockUserId),
    ).rejects.toThrow();
  });
});
