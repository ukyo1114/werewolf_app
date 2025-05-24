import { ObjectId } from 'mongodb';
import Channel from '../../src/models/channelModel';
import Game from '../../src/models/gameModel';
import channelManager from '../../src/classes/ChannelManager';
import GameManager from '../../src/classes/GameManager';
import { createChannelInstance } from '../../src/utils/createChannelInstance';
import { mockUserId, mockChannelId, mockUsers } from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

let testChannelId: string;
let testGameId: string;

beforeAll(async () => {
  const channel = await Channel.create({
    channelName: 'test',
    channelDescription: 'test',
    channelAdmin: mockUserId,
  });
  const game = await Game.create({
    channelId: mockChannelId,
  });

  testChannelId = channel._id.toString();
  testGameId = game._id.toString();

  gameManagers[testGameId] = new GameManager(
    mockChannelId,
    testGameId,
    mockUsers,
  );
  gameManagers[testGameId].sendMessage = jest.fn();
});

afterAll(() => {
  const timerId = gameManagers[testGameId]?.phaseManager.timerId;
  if (timerId) clearTimeout(timerId);

  delete gameManagers[testGameId];
  jest.restoreAllMocks();
});

describe('test createChannelInstance', () => {
  it('チャンネル用インスタンスを作成', async () => {
    const channelInstance = await createChannelInstance(testChannelId);

    expect(channelInstance).toBeInstanceOf(channelManager);
  });

  it('ゲーム用インスタンスを作成', async () => {
    const channelInstance = await createChannelInstance(testGameId);

    expect(channelInstance).toBeInstanceOf(channelManager);
  });

  it('ゲームが進行中でない時エラーを返す', async () => {
    const gameNotExists = await Game.create({
      channelId: mockChannelId,
    });
    const gameIdNotExists = gameNotExists._id.toString();

    await expect(() =>
      createChannelInstance(gameIdNotExists),
    ).rejects.toThrow();
  });

  it('チャンネルもゲームも存在しない時エラーを返す', async () => {
    const channelIdNotExists = new ObjectId().toString();

    await expect(() =>
      createChannelInstance(channelIdNotExists),
    ).rejects.toThrow();
  });
});
