import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';
import Message from '../../src/models/messageModel';

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
  jest.clearAllMocks();
  await Message.deleteMany({});
});

describe('Message Model Test', () => {
  it('メッセージの作成に成功する', async () => {
    const message = await Message.create({
      channelId,
      userId,
      message: 'テスト用メッセージ',
    });

    expect(message.channelId.toString()).toBe(channelId);
    expect(message.userId.toString()).toBe(userId);
    expect(message.message).toBe('テスト用メッセージ');
    expect(message.createdAt).toBeDefined();
  });

  it('必須項目が未入力の場合、メッセージの作成に失敗する', async () => {
    const invalidData = {};

    await expect(Message.create(invalidData)).rejects.toThrow();
  });
});
