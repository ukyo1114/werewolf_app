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
import { errors } from '../../src/config/messages';

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
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(200);
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
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message', errors.PERMISSION_DENIED);
  });

  it('チャンネルが見つからない時エラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .get(`/api/block/list/${mockChannelId}`)
      .send()
      .set('authorization', `Bearer mockToken`)
      .expect(404);

    expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
  });
});

describe('/register', () => {
  it('ブロックユーザーを追加する', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });
    const badUserId = new ObjectId().toString();

    const response = await request(app)
      .post(`/api/block/register/${testChannelId}`)
      .send({ selectedUser: badUserId })
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(200);

    const createdBlockUser = await ChannelBlockUser.findOne({
      channelId: testChannelId,
      userId: badUserId,
    });

    expect(createdBlockUser).not.toBeNull();
  });

  it('管理者でなければエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: blockUserId });
    const badUserId = new ObjectId().toString();

    const response = await request(app)
      .post(`/api/block/register/${testChannelId}`)
      .send({ selectedUser: badUserId })
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message', errors.PERMISSION_DENIED);
  });

  it('ユーザーが既にブロックされているときエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .post(`/api/block/register/${testChannelId}`)
      .send({ selectedUser: blockUserId })
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'message',
      errors.USER_ALREADY_BLOCKED,
    );
  });

  it('チャンネルが見つからない時エラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });
    const badUserId = new ObjectId().toString();

    const response = await request(app)
      .post(`/api/block/register/${mockChannelId}`)
      .send({ selectedUser: badUserId })
      .set('authorization', `Bearer mockToken`)
      .expect(404);

    expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
  });

  it('自身をブロックしようとするとエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .post(`/api/block/register/${testChannelId}`)
      .send({ selectedUser: testUserId })
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message', errors.DENIED_SELF_BLOCK);
  });
});

describe('/cancel', () => {
  it('ブロックを取り消す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .delete(`/api/block/cancel/${testChannelId}`)
      .send({ selectedUser: blockUserId })
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(200);

    const deletedBlockUser = await ChannelBlockUser.findOne({
      channelId: testChannelId,
      userId: blockUserId,
    });

    expect(deletedBlockUser).toBeNull();
  });

  it('管理者でなければエラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: blockUserId });

    const response = await request(app)
      .delete(`/api/block/cancel/${testChannelId}`)
      .send({ selectedUser: blockUserId })
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message', errors.PERMISSION_DENIED);
  });

  it('ユーザーがブロックされていなかった場合エラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });
    const nonBlockedUserId = new ObjectId().toString();

    const response = await request(app)
      .delete(`/api/block/cancel/${testChannelId}`)
      .send({ selectedUser: nonBlockedUserId })
      .set('authorization', `Bearer mockToken`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', errors.USER_NOT_BLOCKED);
  });

  it('チャンネルが見つからない時エラーを返す', async () => {
    (decodeToken as jest.Mock).mockReturnValue({ userId: testUserId });

    const response = await request(app)
      .delete(`/api/block/cancel/${mockChannelId}`)
      .send({ selectedUser: blockUserId })
      .set('authorization', `Bearer mockToken`)
      .expect(404);

    expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
  });
});
