import { ObjectId } from 'mongodb';
import User from '../../src/models/userModel';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import { games } from '../../src/classes/GameInstanceManager';
import { createGameList } from '../../src/controllers/spectateController/utils';
import { errors, validation } from '../../src/config/messages';

let testUserId: string;

beforeAll(async () => {
  const testUser = await User.create({
    userName: 'testUser',
    email: 'test@example.com',
    password: 'password123',
    pic: null,
    isGuest: false,
  });

  testUserId = testUser._id.toString();

  games[mockGameId] = new GameManager(mockChannelId, mockGameId, mockUsers);
  games[mockGameId].playerManager.players = {
    [testUserId]: {
      userId: testUserId,
      userName: 'testUser',
      status: 'alive',
      role: 'villager',
    },
  };
  games[mockGameId].sendMessage = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  const timerId = games[mockGameId]?.phaseManager.timerId;

  if (timerId) {
    clearTimeout(timerId);
  }
  delete games[mockGameId];
});

describe('test createGameList', () => {
  it('ゲームリストを作成', async () => {
    const gameList = await createGameList(mockChannelId);

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

  it('ゲームが存在しないとき空の配列を返す', async () => {
    const gameList = await createGameList(new ObjectId().toString());

    expect(gameList).toEqual([]);
  });
});
