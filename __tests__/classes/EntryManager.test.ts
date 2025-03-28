/*
 ** インスタンスが正しく作成できること
 ** ユーザーを追加できること
 ** ユーザーを削除できること
 ** ユーザーリストを取得できること
 ** 更新が行われたとき通知されること
 ** ユーザー数が規定に達したときゲームが始まること
 ** 正しくゲームが開始されること
 ** ゲームの開始中にエラーが発生したとき通知されること
 */
// import EventEmitter from 'events';
/* jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
  Events: { entryEvents: new EventEmitter() },
})); */

import User from '../../src/models/userModel';
import Game from '../../src/models/gameModel';
import GameManager from '../../src/classes/GameManager';
import EntryManager from '../../src/classes/EntryManager';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../jest.setup';
import { appState, Events } from '../../src/app';
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

  entryEmitSpy = jest.spyOn(Events.entryEvents, 'emit');

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
    // const entryUpdateSpy = jest.spyOn(entryManager, 'entryUpdate');
    await entryManager.register(mockUserId, 'testSocketId');

    expect(entryManager.users).toEqual({
      testSocketId: mockUserId,
    });
    expect(entryUpdateSpy).toHaveBeenCalled();
  });

  it('処理中のときスキップする', async () => {
    // const entryUpdateSpy = jest.spyOn(entryManager, 'entryUpdate');
    entryManager.isProcessing = true;

    await expect(() =>
      entryManager.register(mockUserId, 'testSocketId'),
    ).rejects.toThrow();

    expect(entryManager.users).not.toHaveProperty('testSocketId');
    expect(entryUpdateSpy).not.toHaveBeenCalled();
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

  it('処理中の時スキップする', () => {
    entryManager.isProcessing = true;

    expect(() => entryManager.cancel('testSocketId')).toThrow();

    expect(entryManager.users).toHaveProperty('testSocketId');
    expect(entryUpdateSpy).not.toHaveBeenCalled();
  });
});

describe('test getUserList', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
  });

  it('ユーザーリストを返す', () => {
    const userList = entryManager.getUserList();

    expect(userList).toEqual([mockUserId]);
  });

  it('ユーザーがいないとき空の配列を返す', () => {
    entryManager.users = {};
    const userList = entryManager.getUserList();

    expect(userList).toEqual([]);
  });
});

describe('test entryUpdate', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
    entryUpdateSpy.mockRestore();
  });

  it('更新が通知される', () => {
    entryManager.entryUpdate();

    expect(entryEmitSpy).toHaveBeenCalledWith('entryUpdate', {
      channelId: mockChannelId,
      userList: [mockUserId],
    });
  });
});

describe('test getUsersDetail', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    getUsersDetailSpy.mockRestore();
    entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: testUserId };
  });

  it('ユーザー情報の配列を取得', async () => {
    const users = await entryManager.getUsersDetail();

    expect(users).toEqual([{ userId: testUserId, userName: 'testUser' }]);
  });
});

describe('test createGame', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    createGameSpy.mockRestore();
    entryManager = new EntryManager(mockChannelId, 10);
  });

  it('ゲームを作成する', async () => {
    const testUsers = [
      { userId: mockUserId, userName: 'mockUser' },
      ...mockUsers,
    ];
    testUsers.pop();

    const gameId = await entryManager.createGame(testUsers);
    const game = appState.gameManagers[gameId];

    const registeredUser = await GameUser.exists({
      gameId,
      userId: mockUserId,
    });

    expect(registeredUser).not.toBe(null);
    expect(game).toBeInstanceOf(GameManager);

    const timerId = game.phaseManager.timerId;
    if (timerId) {
      clearTimeout(timerId);
    }
  });
});

describe('test emitGameStart', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
  });

  it('ゲーム開始を通知', () => {
    entryManager.emitGameStart(mockGameId);

    expect(entryEmitSpy).toHaveBeenCalledWith('gameStart', {
      users: ['testSocketId'],
      gameId: mockGameId,
    });
  });
});

describe('test gameStart', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    startGameSpy.mockRestore();
    entryManager = new EntryManager(mockChannelId, 1);
    entryManager.users = { testSocketId: mockUserId };
  });

  it('ゲームを開始する', async () => {
    entryManager.isProcessing = true;
    await entryManager.startGame();

    expect(getUsersDetailSpy).toHaveBeenCalled();
    expect(createGameSpy).toHaveBeenCalled();
    expect(entryEmitSpy).toHaveBeenCalledWith('gameStart', {
      users: ['testSocketId'],
      gameId: mockGameId,
    });
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
