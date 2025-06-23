import { EventEmitter } from 'events';
jest.mock('../../../src/app', () => ({
  appState: {
    gameManagers: {},
  },
  Events: {
    gameEvents: new EventEmitter(),
    channelEvents: new EventEmitter(),
  },
}));

import User from '../../../src/models/User';
import GameManager from '../../../src/classes/GameManager';
import { createGameList } from '../../../src/controllers/spectateController/utils';
import { ObjectId } from 'mongodb';
import { mockUsers } from '../../../__mocks__/mockdata';
import { appState } from '../../../src/app';
import mongoose from 'mongoose';

describe('test createGameList', () => {
  const { gameManagers } = appState;
  const testUserId = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();
  const testGameId = new ObjectId().toString();

  beforeEach(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    await Promise.all([
      User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        pic: null,
      }),
    ]);

    gameManagers[testGameId] = new GameManager(
      testChannelId,
      testGameId,
      mockUsers,
    );
    const game = gameManagers[testGameId];
    game.playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUser',
        status: 'alive',
        role: 'villager',
        teammates: [],
      },
    };
  });

  afterEach(async () => {
    const timerId = gameManagers[testGameId].phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    delete gameManagers[testGameId];
  });

  it('should return empty array if no games are found', async () => {
    const result = await createGameList('testChannelId');
    expect(result).toEqual([]);
  });

  it('should return game list', async () => {
    const result = await createGameList(testChannelId);
    expect(result).toEqual([
      {
        gameId: testGameId,
        players: [
          {
            _id: new ObjectId(testUserId),
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

  it('should return empty array if no users are found', async () => {
    await User.deleteMany();
    const result = await createGameList(testChannelId);
    expect(result).toEqual([
      {
        gameId: testGameId,
        players: [],
        currentDay: 0,
        currentPhase: 'pre',
        result: 'running',
      },
    ]);
  });
});
