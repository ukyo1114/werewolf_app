jest.mock('../../src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));

import { ObjectId } from 'mongodb';
import app from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/userModel';
import Channel from '../../src/models/channelModel';
import ChannelBlockUser from '../../src/models/channelBlockUserModel';
import { mockChannelId, mockUserId } from '../../jest.setup';
import { errors, validation } from '../../src/config/messages';

let testUserId: string;
let blockUserId: string;
let testChannelId: string;

beforeAll(async () => {
  const testUser = await User.create({
    userName: 'testUser',
    email: 'test@example.com',
    password: 'password123',
    pic: null,
    isGuest: false,
  });

  const blockUser = await User.create({
    userName: 'blockUser',
    email: 'blockUser@example.com',
    password: 'password123',
    pic: null,
    isGuest: false,
  });

  testUserId = testUser._id.toString();
  blockUserId = blockUser._id.toString();

  const channel = await Channel.create({
    channelName: 'testChannel',
    channelDescription: 'testDescription',
    channelAdmin: testUserId,
  });

  testChannelId = channel._id.toString();

  await ChannelBlockUser.create({
    channelId: testChannelId,
    userId: blockUserId,
  });
});

afterEach(() => {
  app.close();
});

describe('/list', () => {
  it('ブロックユーザーのリストを取得する', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .get(`/api/block/list/${testChannelId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(200);

    expect(response.body).toEqual([
      {
        _id: blockUserId,
        userName: 'blockUser',
        pic: null,
      },
    ]);
  });

  it('管理者でなければエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: blockUserId });

    const response = await request(app)
      .get(`/api/block/list/${testChannelId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(403);

    expect(response.body).toHaveProperty('message', errors.PERMISSION_DENIED);
  });

  it('チャンネルが見つからない時エラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .get(`/api/block/list/${mockChannelId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(404);

    expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
  });

  it('チャンネルIDがmongoIdでないときエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .get('/api/block/list/wrongId')
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(400);

    expect(response.body).toHaveProperty(
      'message',
      validation.INVALID_CHANNEL_ID,
    );
  });
});

describe('/register', () => {
  const customRequest = async (
    userId: string,
    channelId: string,
    selectedUser: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .post(`/api/block/register/${channelId}`)
      .send({ selectedUser })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);
  };

  it('ブロックユーザーを追加する', async () => {
    const badUserId = new ObjectId().toString();

    await customRequest(testUserId, testChannelId, badUserId, 200);

    const createdBlockUser = await ChannelBlockUser.findOne({
      channelId: testChannelId,
      userId: badUserId,
    });

    expect(createdBlockUser).not.toBeNull();
  });

  it('管理者でなければエラーを返す', async () => {
    const badUserId = new ObjectId().toString();

    await customRequest(
      blockUserId,
      testChannelId,
      badUserId,
      403,
      errors.PERMISSION_DENIED,
    );
  });

  it('ユーザーが既にブロックされているときエラーを返す', async () => {
    await customRequest(
      testUserId,
      testChannelId,
      blockUserId,
      400,
      errors.USER_ALREADY_BLOCKED,
    );
  });

  it('チャンネルが見つからない時エラーを返す', async () => {
    await customRequest(
      testUserId,
      mockChannelId,
      new ObjectId().toString(),
      404,
      errors.CHANNEL_NOT_FOUND,
    );
  });

  it('自身をブロックしようとするとエラーを返す', async () => {
    await customRequest(
      testUserId,
      testChannelId,
      testUserId,
      403,
      errors.DENIED_SELF_BLOCK,
    );
  });

  it('チャンネルIDがmongoIDでないとき', async () => {
    await customRequest(
      testUserId,
      'wrongChannelId',
      new ObjectId().toString(),
      400,
      validation.INVALID_CHANNEL_ID,
    );
  });

  it('ブロックするユーザーIDがmongoIDでないとき', async () => {
    await customRequest(
      testUserId,
      testChannelId,
      'wrongUserId',
      400,
      validation.INVALID_SELECTED_USER,
    );
  });
});

describe('/cancel', () => {
  const customRequest = async (
    userId: string,
    channelId: string,
    selectedUser: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .delete(`/api/block/cancel/${channelId}`)
      .send({ selectedUser })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);
  };

  it('ブロックを取り消す', async () => {
    await customRequest(testUserId, testChannelId, blockUserId, 200);

    const deletedBlockUser = await ChannelBlockUser.findOne({
      channelId: testChannelId,
      userId: blockUserId,
    });

    expect(deletedBlockUser).toBeNull();
  });

  it('管理者でないとき', async () => {
    await customRequest(
      blockUserId,
      testChannelId,
      blockUserId,
      403,
      errors.PERMISSION_DENIED,
    );
  });

  it('ユーザーがブロックされていなかったとき', async () => {
    await customRequest(
      testUserId,
      testChannelId,
      new ObjectId().toString(),
      404,
      errors.USER_NOT_BLOCKED,
    );
  });

  it('チャンネルが見つからないとき', async () => {
    await customRequest(
      testUserId,
      mockChannelId,
      blockUserId,
      404,
      errors.CHANNEL_NOT_FOUND,
    );
  });

  it('チャンネルIDがmongoIDでないとき', async () => {
    await customRequest(
      testUserId,
      'wrongChannelId',
      blockUserId,
      400,
      validation.INVALID_CHANNEL_ID,
    );
  });

  it('ブロックを取り消したいユーザーIDがmongoIDでないとき', async () => {
    await customRequest(
      testUserId,
      testChannelId,
      'wrongUserId',
      400,
      validation.INVALID_SELECTED_USER,
    );
  });
});
