import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';

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
});

beforeEach(async () => {
  jest.clearAllMocks();
  await Channel.deleteMany({});

  const channel = await Channel.create({
    channelName: 'testChannel',
    channelDescription: 'testDescription',
    password_enabled: true,
    password: 'securepassword',
    channelAdmin: userId,
  });
  channelId = channel._id.toString();
});

describe('Channel Model Test', () => {
  it('チャンネルの作成に成功する', async () => {
    const channelData = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      password_enabled: true,
      password: 'securepassword',
      channelAdmin: userId,
    };

    const channel = await Channel.create(channelData);

    expect(channel.channelName).toBe(channelData.channelName);
    expect(channel.channelDescription).toBe(channelData.channelDescription);
    expect(channel.password).not.toBe(channelData.password); // パスワードはハッシュ化されている
    expect(channel.createdAt).toBeDefined();
    expect(channel.updatedAt).toBeDefined();
  });

  it('パスワード設定を無効化した状態でチャンネルの作成に成功する', async () => {
    const channelData = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      password_enabled: false,
      password: 'パスワード設定が無効の場合undefinedとなる',
      channelAdmin: userId,
    };

    const channel = await Channel.create(channelData);

    expect(channel.channelName).toBe(channelData.channelName);
    expect(channel.channelDescription).toBe(channelData.channelDescription);
    expect(channel.password).toBeUndefined();
    expect(channel.createdAt).toBeDefined();
    expect(channel.updatedAt).toBeDefined();
  });

  it('パスワード設定が有効な時、パスワードが入力されていないとエラーとなる', async () => {
    const invalidData = {
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      password_enabled: true,
      password: undefined,
      channelAdmin: userId,
    };

    await expect(Channel.create(invalidData)).rejects.toThrow();
  });

  it('既存のチャンネルのパスワードを変更する', async () => {
    const channel = await Channel.findById(channelId).select('password');
    expect(channel).not.toBeNull();

    channel!.password = '変更されたパスワード';
    await channel!.save();

    const updatedChannel = await Channel.findById(channelId).select('password');
    expect(updatedChannel).not.toBeNull();

    expect(updatedChannel!.password).not.toBe('変更されたパスワード'); // パスワードはハッシュ化されている
  });

  it('既存のチャンネルのパスワードを無効にする', async () => {
    const channel =
      await Channel.findById(channelId).select('password_enabled');
    expect(channel).not.toBeNull();

    channel!.password_enabled = false;
    await channel!.save();

    const updatedChannel = await Channel.findById(channelId);
    expect(updatedChannel).not.toBeNull();

    expect(updatedChannel!.password_enabled).toBe(false);
    expect(updatedChannel!.password).toBeUndefined();
  });

  it('パスワードを入力せずにパスワードを有効化しようとするとエラーになる', async () => {
    const channel = await Channel.create({
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      password_enabled: false,
      channelAdmin: userId,
    });
    expect(channel).not.toBeNull();

    channel!.password_enabled = true;

    await expect(channel!.save()).rejects.toThrow();
  });

  it('必須項目が未入力の場合、チャンネルの作成に失敗する', async () => {
    const invalidData = {};

    await expect(Channel.create(invalidData)).rejects.toThrow();
  });
});
