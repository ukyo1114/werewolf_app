import Channel from '../../src/models/channelModel';
import { checkChannelAdmin } from '../../src/utils/checkChannelAdmin';
import { mockChannelId, mockUserId } from '../../jest.setup';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';

let testChannelId: string;

beforeAll(async () => {
  const channel = await Channel.create({
    channelName: 'testChanel',
    channelDescription: 'testDescription',
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
    const isChannelAdmin = await checkChannelAdmin(
      testChannelId,
      'nonExistentUser',
    );

    expect(isChannelAdmin).toBe(false);
  });

  it('チャンネルが見つからないときエラーを返す', async () => {
    await expect(() =>
      checkChannelAdmin(mockChannelId, mockUserId),
    ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
  });
});
