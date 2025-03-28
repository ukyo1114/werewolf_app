/**
 * test createChannelInstance
 * An instance for the channel is created
 * An instance for the game is created
 * An error occurs if the game is not in progress
 * An error occurs if neither the channel nor the game exists
 */
import { ObjectId } from 'mongodb';
import Channel from '../../src/models/channelModel';
import Game from '../../src/models/gameModel';
import channelManager from '../../src/classes/ChannelManager';
import GameManager from '../../src/classes/GameManager';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';
import { createChannelInstance } from '../../src/classes/ChannelInstanceManager';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

let testChannelId: string;
let testGameId: string;

beforeAll(async () => {
  const channel = await Channel.create({
    channelName: 'testChannelName',
    channelDescription: 'testDescription',
    channelAdmin: mockUserId,
  });
  const game = await Game.create({
    channelId: mockChannelId,
  });

  testChannelId = channel._id.toString();
  testGameId = game._id.toString();
});

beforeEach(() => {
  gameManagers[testGameId] = new GameManager(
    mockChannelId,
    testGameId,
    mockUsers,
  );
  gameManagers[testGameId].sendMessage = jest.fn();
});

afterEach(() => {
  const timerId = gameManagers[testGameId]?.phaseManager.timerId;

  if (timerId) {
    clearTimeout(timerId);
  }
});

afterAll(() => {
  delete gameManagers[testGameId];
  jest.restoreAllMocks();
});

describe('test createChannelInstance', () => {
  it('An instance for the channel is created', async () => {
    const channelInstance = await createChannelInstance(testChannelId);

    expect(channelInstance).toBeInstanceOf(channelManager);
  });

  it('An instance for the game is created', async () => {
    const channelInstance = await createChannelInstance(testGameId);

    expect(channelInstance).toBeInstanceOf(channelManager);
  });

  it('An error occurs if the game is not in progress', async () => {
    const gameNotExists = await Game.create({
      channelId: mockChannelId,
    });

    const gameIdNotExists = gameNotExists._id.toString();

    expect(gameManagers[gameIdNotExists]).toBeUndefined();

    await expect(() => createChannelInstance(gameIdNotExists)).rejects.toThrow(
      new AppError(404, errors.GAME_NOT_FOUND),
    );
  });

  it('An error occurs if neither the channel nor the game exists', async () => {
    const channelIdNotExists = new ObjectId().toString();

    await expect(() =>
      createChannelInstance(channelIdNotExists),
    ).rejects.toThrow(new AppError(404, errors.CHANNEL_NOT_FOUND));
  });
});
