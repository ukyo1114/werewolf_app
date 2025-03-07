import { Namespace, Socket } from 'socket.io';
import { io as Client } from 'socket.io-client';
import app, { appState } from '../../src/app';
import { AddressInfo } from 'net';
import { genUserToken } from '../../src/utils/generateToken';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../jest.setup';
import User from '../../src/models/userModel';
import { errors } from '../../src/config/messages';
import GameManager from '../../src/classes/GameManager';
import Channel from '../../src/models/channelModel';
import ChannelUser from '../../src/models/channelUserModel';
import EntryManager from '../../src/classes/EntryManager';

jest.spyOn(EntryManager.prototype, 'getUsersDetail').mockImplementation();
jest.spyOn(EntryManager.prototype, 'createGame').mockResolvedValue(mockGameId);

const { entryManagers } = appState;

let baseUrl: string;
let testUserId: string;
let testUser2Id: string;
let testChannelId: string;
let testChannel2Id: string;

beforeAll(async () => {
  const [testUser, testUser2] = await Promise.all([
    User.create({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password',
      isGuest: false,
    }),
    User.create({
      userName: 'testuser2',
      email: 'test2@example.com',
      password: 'password',
      isGuest: false,
    }),
  ]);

  testUserId = testUser._id.toString();
  testUser2Id = testUser2._id.toString();

  const [testChannel, testChannel2] = await Promise.all([
    Channel.create({
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      channelAdmin: testUserId,
    }),
    Channel.create({
      channelName: 'testChannel',
      channelDescription: 'testDescription',
      channelAdmin: testUserId,
    }),
  ]);

  testChannelId = testChannel._id.toString();
  testChannel2Id = testChannel2._id.toString();

  await Promise.all([
    ChannelUser.create({ channelId: testChannelId, userId: testUserId }),
    ChannelUser.create({ channelId: mockChannelId, userId: testUserId }),
  ]);

  // baseUrlを設定
  const port = (app.address() as AddressInfo).port;
  baseUrl = `http://localhost:${port}`;
});

afterEach(() => {
  appState.entryManagers = {};
});

describe('test entryNameSpace', () => {
  const createClientSocket = (
    token: string | undefined,
    channelId: string | undefined,
  ) => Client(`${baseUrl}/entry`, { auth: { token, channelId } });

  describe('connect', () => {
    const result = async (token: string | undefined, gameId: string | null) => {
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);

        clientSocket.on('connect_response', (receivedGameId: string | null) => {
          expect(receivedGameId).toBe(gameId);
          resolve();
        });

        clientSocket.connect();
      });

      clientSocket.close();
    };

    it('ユーザーがゲームに参加していないとき', async () => {
      const token = genUserToken(testUserId);
      await result(token, null);
    });

    it('ユーザーがゲームに参加しているとき', async () => {
      const game = new GameManager(mockChannelId, mockGameId, mockUsers);
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUser',
          status: 'alive',
          role: 'villager',
        },
      };

      const token = genUserToken(testUserId);
      await result(token, mockGameId);

      const timerId = game.phaseManager.timerId;
      if (timerId) clearTimeout(timerId);
    });
  });

  describe('join channel', () => {
    const result = async (errorMessage?: string) => {
      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          const response = await clientSocket.emitWithAck('joinChannel');

          expect(response).toEqual({ users: [] });
          resolve();
        });

        clientSocket.on('connect_error', (error: { message: string }) => {
          expect(error.message).toBe(errorMessage);
          resolve();
        });

        clientSocket.connect();
      });

      clientSocket.close();
    };

    it('チャンネル参加に成功する', async () => {
      await result(testChannelId);

      expect(entryManagers[testChannelId].channelId).toBe(testChannelId);
    });
  });

  describe('register entry', () => {
    it('ゲームにエントリーできる', async () => {
      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          clientSocket.on('entryUpdate', (userList) => {
            expect(userList).toEqual([testUserId]);
            resolve();
          });

          await clientSocket.emitWithAck('joinChannel');
          const response = await clientSocket.emitWithAck('registerEntry');
          expect(response.success).toBe(true);
        });

        clientSocket.connect();
      });

      clientSocket.close();

      const entryUsers = entryManagers[testChannelId].getUserList();
      expect(entryUsers).toEqual([testUserId]);
    });

    it('処理中のとき', async () => {
      entryManagers[testChannelId] = new EntryManager(testChannelId, 10);
      entryManagers[testChannelId].isProcessing = true;

      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          await clientSocket.emitWithAck('joinChannel');
          const response = await clientSocket.emitWithAck('registerEntry');
          expect(response.success).toBe(false);
          resolve();
        });

        clientSocket.connect();
      });

      clientSocket.close();

      const entryUsers = entryManagers[testChannelId].getUserList();
      expect(entryUsers).toEqual([]);
    });

    it('ゲーム開始人数に達したとき', async () => {
      entryManagers[testChannelId] = new EntryManager(testChannelId, 1);

      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          clientSocket.on('gameStart', (gameId) => {
            expect(gameId).toBe(mockGameId);
            resolve();
          });

          await clientSocket.emitWithAck('joinChannel');
          const response = await clientSocket.emitWithAck('registerEntry');
          expect(response.success).toBe(true);
        });

        clientSocket.connect();
      });

      clientSocket.close();

      const entryUsers = entryManagers[testChannelId].getUserList();
      expect(entryUsers).toEqual([]);
    });
  });

  describe('cancel entry', () => {
    const result = async (cancelResult: boolean) => {
      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          await clientSocket.emitWithAck('joinChannel');
          await clientSocket.emitWithAck('registerEntry');
          const response = await clientSocket.emitWithAck('cancelEntry');
          expect(response.success).toBe(cancelResult);
          resolve();
        });

        clientSocket.connect();
      });

      clientSocket.close();
    };

    it('エントリーのキャンセルに成功', async () => {
      entryManagers[testChannelId] = new EntryManager(testChannelId, 10);

      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          await clientSocket.emitWithAck('joinChannel');
          await clientSocket.emitWithAck('registerEntry');

          clientSocket.on('entryUpdate', (userList) => {
            expect(userList).toEqual([]);
            resolve();
          });

          const response = await clientSocket.emitWithAck('cancelEntry');
          expect(response.success).toBe(true);
        });

        clientSocket.connect();
      });

      clientSocket.close();

      const entryUsers = entryManagers[testChannelId].getUserList();
      expect(entryUsers).toEqual([]);
    });

    it('処理中のとき', async () => {
      entryManagers[testChannelId] = new EntryManager(testChannelId, 10);

      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          await clientSocket.emitWithAck('joinChannel');
          await clientSocket.emitWithAck('registerEntry');
          entryManagers[testChannelId].isProcessing = true;
          const response = await clientSocket.emitWithAck('cancelEntry');
          expect(response.success).toBe(false);
          resolve();
        });

        clientSocket.connect();
      });

      clientSocket.close();

      const entryUsers = entryManagers[testChannelId].getUserList();
      expect(entryUsers).toEqual([testUserId]);
    });
  });

  describe('auth error', () => {
    const result = async (
      token: string | undefined,
      errorMessage: string,
      channelId: string | undefined,
    ) => {
      const clientSocket = createClientSocket(token, channelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);

        clientSocket.on('connect_error', (error: { message: string }) => {
          expect(error.message).toBe(errorMessage);
          resolve();
        });

        clientSocket.connect();
      });

      clientSocket.close();
    };

    it('トークンがundefinedのとき', async () => {
      const token = undefined;
      await result(token, errors.INVALID_TOKEN, testChannelId);
    });

    it('トークンの形式が不正なとき', async () => {
      const token = 'wrongToken';
      await result(token, errors.INVALID_TOKEN, testChannelId);
    });

    it('ユーザーが登録されていないとき', async () => {
      const token = genUserToken(mockUserId);
      await result(token, errors.USER_NOT_FOUND, testChannelId);
    });

    it('ユーザーIdの形式が不正なとき', async () => {
      const token = genUserToken('wrongUserId');
      await result(token, errors.INVALID_TOKEN, testChannelId);
    });

    it('ユーザーがチャンネルに参加していないとき', async () => {
      const token = genUserToken(testUser2Id);
      await result(token, errors.CHANNEL_ACCESS_FORBIDDEN, testChannelId);
    });

    it('チャンネルが存在しないとき', async () => {
      const token = genUserToken(testUserId);
      await result(token, errors.CHANNEL_ACCESS_FORBIDDEN, mockChannelId);
    });
  });
});
