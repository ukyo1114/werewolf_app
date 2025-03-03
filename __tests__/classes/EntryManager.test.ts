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
import EventEmitter from 'events';
jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
  Events: { entryEvents: new EventEmitter() },
}));

import { ObjectId } from 'mongodb';
import Channel from '../../src/models/channelModel';
import User from '../../src/models/userModel';
import Game from '../../src/models/gameModel';
import { games } from '../../src/classes/GameInstanceManager';
import channelManager from '../../src/classes/ChannelManager';
import GameManager from '../../src/classes/GameManager';
import EntryManager from '../../src/classes/EntryManager';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';
import { createChannelInstance } from '../../src/classes/ChannelInstanceManager';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../jest.setup';
import { Events } from '../../src/app';

let startGameSpy: any;
let entryUpdateSpy: any;
let entryEmitSpy: any;

beforeEach(() => {
  startGameSpy = jest
    .spyOn(EntryManager.prototype, 'startGame')
    .mockImplementation();

  entryUpdateSpy = jest
    .spyOn(EntryManager.prototype, 'entryUpdate')
    .mockImplementation();

  entryEmitSpy = jest.spyOn(Events.entryEvents, 'emit');
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  // await Game.deleteMany({});
});

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
    await entryManager.register(mockUserId, 'testSocketId');

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

    entryManager.cancel('testSocketId');

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

describe('test startGame', () => {});
