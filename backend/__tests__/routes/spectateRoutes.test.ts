import app, { appState } from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import { mockChannelId, mockGameId, mockUsers } from '../../__mocks__/mockdata';
import { errors, validation } from '../../src/config/messages';
import ChannelUserManager from '../../src/classes/ChannelUserManager';
import ChannelManager from '../../src/classes/ChannelManager';
import GameManager from '../../src/classes/GameManager';
import { genUserToken } from '../../src/utils/generateToken';
import { ObjectId } from 'mongodb';
const { gameManagers, channelManagers } = appState;

describe('test spectateRoutes', () => {
  const testUserId = new ObjectId().toString();
  const testUser2Id = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();

  beforeAll(async () => {
    await User.deleteMany();

    const [testUser, testUser2] = await Promise.all([
      User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
      User.create({
        _id: testUser2Id,
        userName: 'testUser2',
        email: 'test2@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
      Channel.create({
        _id: testChannelId,
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        channelAdmin: testUserId,
      }),
    ]);

    channelManagers[testChannelId] = new ChannelManager(testChannelId);

    channelManagers[testChannelId].users = {
      [testUserId]: new ChannelUserManager({
        userId: testUserId,
        socketId: 'testUser',
        status: 'normal',
      }),
    };

    gameManagers[mockGameId] = new GameManager(
      testChannelId,
      mockGameId,
      mockUsers,
    );
    gameManagers[mockGameId].playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUser',
        status: 'alive',
        role: 'villager',
        teammates: [],
      },
    };
    gameManagers[mockGameId].sendMessage = jest.fn();
  });

  afterAll(() => {
    const timerId = gameManagers[mockGameId]?.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    delete gameManagers[mockGameId];
    app.close();
  });

  const customRequest = async (
    userId: string,
    channelId: string | undefined,
    status: number,
    errorMessage?: string,
  ) => {
    const mockToken = genUserToken(userId);
    const response = await request(app)
      .get(`/api/spectate/${channelId}`)
      .send()
      .set('authorization', `Bearer ${mockToken}`)
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response.body;
  };

  it('ゲームリストを取得', async () => {
    const gameList = await customRequest(testUserId, testChannelId, 200);

    expect(gameList).toEqual([
      {
        gameId: mockGameId,
        players: [
          {
            _id: testUserId,
            userName: 'testUser',
            pic: null,
          },
        ],
        currentDay: 0,
        currentPhase: 'pre',
        result: 'running',
      },
    ]);
  });

  it('チャンネルが存在しない時エラーを返す', async () => {
    await customRequest(
      testUserId,
      mockChannelId,
      403,
      errors.CHANNEL_ACCESS_FORBIDDEN,
    );
  });

  it('ユーザーがチャンネルに参加していないとき', async () => {
    await customRequest(
      testUser2Id,
      testChannelId,
      403,
      errors.CHANNEL_ACCESS_FORBIDDEN,
    );
  });

  it('チャンネルIDが送信されなかったとき', async () => {
    await customRequest(
      testUser2Id,
      undefined,
      400,
      validation.INVALID_CHANNEL_ID,
    );
  });

  it('チャンネルIDがmongoIDでないとき', async () => {
    await customRequest(
      testUser2Id,
      undefined,
      400,
      validation.INVALID_CHANNEL_ID,
    );
  });
});
