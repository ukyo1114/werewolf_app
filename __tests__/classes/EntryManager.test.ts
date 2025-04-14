import { gameManagers, entryEvents } from '../../jest.setup';
import User from '../../src/models/userModel';
import Game from '../../src/models/gameModel';
import GameManager from '../../src/classes/GameManager';
import PlayerManager from '../../src/classes/PlayerManager';
import EntryManager from '../../src/classes/EntryManager';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../__mocks__/mockdata';
import GameUser from '../../src/models/gameUserModel';

let startGameSpy: any;
let entryUpdateSpy: any;
let entryEmitSpy: any;
let getUsersDetailSpy: any;
let createGameSpy: any;

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
});

beforeEach(() => {
  startGameSpy = jest
    .spyOn(EntryManager.prototype, 'startGame')
    .mockImplementation();

  entryUpdateSpy = jest
    .spyOn(EntryManager.prototype, 'entryUpdate')
    .mockImplementation();

  entryEmitSpy = jest.spyOn(entryEvents, 'emit');

  getUsersDetailSpy = jest
    .spyOn(EntryManager.prototype, 'getUsersDetail')
    .mockResolvedValue([{ userId: testUserId, userName: 'testUser' }]);

  createGameSpy = jest
    .spyOn(EntryManager.prototype, 'createGame')
    .mockResolvedValue(mockGameId);
});

afterEach(async () => {
  await Game.deleteMany({});
  await GameUser.deleteMany({});
  jest.clearAllMocks();
});

/* afterAll(async () => {
  await User.deleteMany({});
}); */

it('インスタンスを作成', () => {
  const entryManager = new EntryManager(mockChannelId, 1);

  expect(entryManager.channelId).toBe(mockChannelId);
  expect(entryManager.MAX_USERS).toBe(1);
  expect(entryManager.isProcessing).toBe(false);
  expect(entryManager.users).toEqual({});
  expect(entryManager).toBeInstanceOf(EntryManager);
});

describe('test register', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 1);
  });

  it('ユーザーを追加', async () => {
    await entryManager.register(mockUserId, 'testSocketId');

    expect(entryManager.users).toEqual({
      testSocketId: mockUserId,
    });
    expect(entryUpdateSpy).toHaveBeenCalled();
  });

  it('処理中のときエラーを返す', async () => {
    entryManager.isProcessing = true;

    await expect(() =>
      entryManager.register(mockUserId, 'testSocketId'),
    ).rejects.toThrow();
  });

  it('ユーザー数が最大に達したときstartGameが呼び出される', async () => {
    await entryManager.register(mockUserId, 'testSocketId');

    expect(entryManager.isProcessing).toBe(true);
    expect(startGameSpy).toHaveBeenCalled();
  });
});

describe('test cancel', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
  });

  it('エントリーをキャンセル', () => {
    entryManager.cancel('testSocketId');

    expect(entryManager.users).toEqual({});
    expect(entryUpdateSpy).toHaveBeenCalled();
  });

  it('処理中の時エラーを返す', () => {
    entryManager.isProcessing = true;
    expect(() => entryManager.cancel('testSocketId')).toThrow();
  });
});

describe('test getUserList', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 1);
  });

  it('ユーザーリストを返す', () => {
    entryManager.users = { testSocketId: mockUserId };

    const userList = entryManager.getUserList();
    expect(userList).toEqual([mockUserId]);
  });

  it('ユーザーがいないとき空の配列を返す', () => {
    const userList = entryManager.getUserList();
    expect(userList).toEqual([]);
  });
});

describe('test entryUpdate', () => {
  it('更新が通知される', () => {
    const entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
    entryUpdateSpy.mockRestore();
    entryManager.entryUpdate();

    expect(entryEmitSpy).toHaveBeenCalledWith('entryUpdate', {
      channelId: mockChannelId,
      userList: [mockUserId],
    });
  });
});

describe('test getUsersDetail', () => {
  it('ユーザー情報の配列を取得', async () => {
    getUsersDetailSpy.mockRestore();
    const entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: testUserId };
    const users = await entryManager.getUsersDetail();

    expect(users).toEqual([{ userId: testUserId, userName: 'testUser' }]);
  });
});

describe('test createGame', () => {
  it('ゲームを作成する', async () => {
    const registerPlayersSpy = jest
      .spyOn(PlayerManager.prototype, 'registerPlayersInDB')
      .mockImplementation();
    createGameSpy.mockRestore();
    const entryManager = new EntryManager(mockChannelId, 10);

    const gameId = await entryManager.createGame(mockUsers);
    expect(registerPlayersSpy).toHaveBeenCalled();
    const gameExists = await Game.exists({ _id: gameId });
    expect(gameExists).not.toBeNull;
    const game = gameManagers[gameId];
    expect(game).toBeInstanceOf(GameManager);

    registerPlayersSpy.mockRestore();
    const timerId = game.phaseManager.timerId;
    if (timerId) {
      clearTimeout(timerId);
    }
  });
});

describe('test emitGameStart', () => {
  it('ゲーム開始を通知', () => {
    const entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
    entryManager.emitGameStart(mockGameId);

    expect(entryEmitSpy).toHaveBeenCalledWith('gameStart', {
      users: ['testSocketId'],
      gameId: mockGameId,
    });
  });
});

describe('test startGame', () => {
  let emitGameStartSpy: any;
  let entryManager: EntryManager;

  beforeEach(() => {
    emitGameStartSpy = jest
      .spyOn(EntryManager.prototype, 'emitGameStart')
      .mockImplementation();
    startGameSpy.mockRestore();
    entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
  });

  it('ゲームを開始する', async () => {
    entryManager.isProcessing = true;
    await entryManager.startGame();

    expect(getUsersDetailSpy).toHaveBeenCalled();
    expect(createGameSpy).toHaveBeenCalled();
    expect(emitGameStartSpy).toHaveBeenCalled();
    expect(entryManager.users).toEqual({});
    expect(entryManager.isProcessing).toBe(false);
  });

  it('tryブロック内でエラーが発生したとき', async () => {
    getUsersDetailSpy = jest
      .spyOn(EntryManager.prototype, 'getUsersDetail')
      .mockRejectedValue(new Error());
    entryManager.isProcessing = true;
    await entryManager.startGame();

    expect(entryEmitSpy).toHaveBeenCalledWith(
      'gameCreationFailed',
      mockChannelId,
    );
    expect(entryManager.users).toEqual({});
    expect(entryManager.isProcessing).toBe(false);
  });
});
