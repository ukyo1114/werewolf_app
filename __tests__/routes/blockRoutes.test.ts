import { ObjectId } from 'mongodb';
import app, { Events } from '../../src/app';
import request from 'supertest';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import ChannelBlockUser from '../../src/models/ChannelBlockUser';
import { mockChannelId } from '../../__mocks__/mockdata';
import { errors, validation } from '../../src/config/messages';
import { genUserToken } from '../../src/utils/generateToken';

describe('test blockRoutes', () => {
  const { channelEvents } = Events;
  const emitSpy = jest.spyOn(channelEvents, 'emit');
  let testUserId: string;
  let blockUserId: string;
  let testChannelId: string;
  let mockToken: string;

  beforeAll(async () => {
    await User.deleteMany({});
    await Channel.deleteMany({});
    await ChannelBlockUser.deleteMany({});

    const [testUser, blockUser] = await Promise.all([
      User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
      User.create({
        userName: 'blockUser',
        email: 'blockUser@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
    ]);

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
    emitSpy.mockClear();
  });

  afterAll(() => {
    app.close();
  });

  describe('/list', () => {
    const customRequest = async (
      userId: string,
      channelId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/block/list/${channelId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
      return response;
    };

    it('should get list of blocked users', async () => {
      const response = await customRequest(testUserId, testChannelId, 200);

      expect(response.body).toEqual([
        {
          _id: blockUserId,
          userName: 'blockUser',
          pic: null,
        },
      ]);
    });

    it('should return error if not admin', async () => {
      const response = await customRequest(blockUserId, testChannelId, 403);

      expect(response.body).toHaveProperty('message', errors.PERMISSION_DENIED);
    });

    it('should return error when channel not found', async () => {
      const response = await customRequest(
        testUserId,
        mockChannelId,
        404,
        errors.CHANNEL_NOT_FOUND,
      );

      expect(response.body).toHaveProperty('message', errors.CHANNEL_NOT_FOUND);
    });

    it('should return 400 when channelId is not a valid mongoId', async () => {
      const response = await customRequest(
        testUserId,
        'wrongId',
        400,
        validation.INVALID_CHANNEL_ID,
      );

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
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .post(`/api/block/register/${channelId}`)
        .send({ selectedUser })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
    };

    it('should add blocked user', async () => {
      const badUserId = new ObjectId().toString();
      await customRequest(testUserId, testChannelId, badUserId, 200);

      const createdBlockUser = await ChannelBlockUser.findOne({
        channelId: testChannelId,
        userId: badUserId,
      });

      expect(createdBlockUser).not.toBeNull();
      expect(emitSpy).toHaveBeenCalledWith('registerBlockUser', {
        channelId: testChannelId,
        userId: badUserId,
      });
    });

    it('should return error if not admin', async () => {
      const badUserId = new ObjectId().toString();

      await customRequest(
        blockUserId,
        testChannelId,
        badUserId,
        403,
        errors.PERMISSION_DENIED,
      );

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when user is already blocked', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        blockUserId,
        500,
        errors.USER_ALREADY_BLOCKED,
      );

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when channel not found', async () => {
      await customRequest(
        testUserId,
        mockChannelId,
        new ObjectId().toString(),
        404,
        errors.CHANNEL_NOT_FOUND,
      );

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when trying to block self', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        testUserId,
        403,
        errors.DENIED_SELF_BLOCK,
      );
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when channel ID is not a valid mongoId', async () => {
      await customRequest(
        testUserId,
        'wrongChannelId',
        new ObjectId().toString(),
        400,
        validation.INVALID_CHANNEL_ID,
      );

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when user ID is not a valid mongoId', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        'wrongUserId',
        400,
        validation.INVALID_SELECTED_USER,
      );

      expect(emitSpy).not.toHaveBeenCalled();
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
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .delete(`/api/block/cancel/${channelId}`)
        .send({ selectedUser })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
    };

    it('should cancel block', async () => {
      await customRequest(testUserId, testChannelId, blockUserId, 200);

      const deletedBlockUser = await ChannelBlockUser.findOne({
        channelId: testChannelId,
        userId: blockUserId,
      });

      expect(deletedBlockUser).toBeNull();
      expect(emitSpy).toHaveBeenCalledWith('cancelBlockUser', {
        channelId: testChannelId,
        userId: blockUserId,
      });
    });

    it('should return error if not admin', async () => {
      await customRequest(
        blockUserId,
        testChannelId,
        blockUserId,
        403,
        errors.PERMISSION_DENIED,
      );
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when user is not blocked', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        new ObjectId().toString(),
        404,
        errors.USER_NOT_BLOCKED,
      );
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when channel not found', async () => {
      await customRequest(
        testUserId,
        mockChannelId,
        blockUserId,
        404,
        errors.CHANNEL_NOT_FOUND,
      );
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when channel ID is not a valid mongoId', async () => {
      await customRequest(
        testUserId,
        'wrongChannelId',
        blockUserId,
        400,
        validation.INVALID_CHANNEL_ID,
      );
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should return error when user ID is not a valid mongoId', async () => {
      await customRequest(
        testUserId,
        testChannelId,
        'wrongUserId',
        400,
        validation.INVALID_SELECTED_USER,
      );
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
