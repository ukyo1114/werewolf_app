import { Namespace, Socket } from 'socket.io';
import { io as Client } from 'socket.io-client';
import app, { appState, io } from '../../src/app';
import { AddressInfo } from 'net';
import { genUserToken } from '../../src/utils/generateToken';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../__mocks__/mockdata';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import ChannelUser from '../../src/models/ChannelUser';
import { errors, socketError } from '../../src/config/messages';
import GameManager from '../../src/classes/GameManager';
import EntryManager from '../../src/classes/EntryManager';
import { ObjectId } from 'mongodb';
import GameUser from '../../src/models/GameUser';
import Game from '../../src/models/Game';
import { decodeToken } from '../../src/utils/decodeToken';

describe('test entryNameSpace', () => {
  const { entryManagers } = appState;
  let baseUrl: string;
  const testUserId = new ObjectId().toString();
  const testUser2Id = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();
  const testChannel2Id = new ObjectId().toString();
  const socketEmitSpy = jest.spyOn(Socket.prototype, 'emit');

  beforeAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Channel.deleteMany({}),
      Game.deleteMany({}),
      ChannelUser.deleteMany({}),
      GameUser.deleteMany({}),
    ]);

    await Promise.all([
      User.create({
        _id: testUserId,
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password',
        isGuest: false,
      }),
      User.create({
        _id: testUser2Id,
        userName: 'testuser2',
        email: 'test2@example.com',
        password: 'password',
        isGuest: false,
      }),
      Channel.create({
        _id: testChannelId,
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        channelAdmin: testUserId,
      }),
      Channel.create({
        _id: testChannel2Id,
        channelName: 'testChannel2',
        channelDescription: 'testDescription2',
        channelAdmin: testUserId,
      }),
      ChannelUser.create({ channelId: testChannelId, userId: testUserId }),
      ChannelUser.create({ channelId: mockChannelId, userId: testUserId }),
    ]);

    // baseUrlを設定
    const port = (app.address() as AddressInfo).port;
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(() => {
    appState.entryManagers = {};
    socketEmitSpy.mockClear();
  });

  afterAll(async () => {
    io.close();
    app.close();
  });

  const createClientSocket = (
    token: string | undefined,
    channelId: string | undefined,
  ) => Client(`${baseUrl}/entry`, { auth: { token, channelId } });

  describe('test auth', () => {
    const result = async ({
      token,
      channelId,
      errorMessage,
      gameId,
    }: {
      token?: string;
      channelId?: string;
      errorMessage?: string;
      gameId?: string;
    }) => {
      const clientSocket = createClientSocket(token, channelId);

      await new Promise<void>((resolve) => {
        if (errorMessage) {
          clientSocket.on('connect_error', (error: any) => {
            if (errorMessage) expect(error.message).toBe(errorMessage);
            if (gameId) expect(error.data.gameId).toBe(gameId);
            resolve();
          });
        } else {
          clientSocket.on('connect', resolve);
        }

        clientSocket.connect();
      });

      clientSocket.close();
    };

    it('should throw error when token is undefined', async () => {
      await result({
        channelId: testChannelId,
        errorMessage: socketError.AUTH_ERROR,
      });
    });

    it('should throw error when channelId is undefined', async () => {
      await result({
        token: genUserToken(testUserId),
        errorMessage: socketError.AUTH_ERROR,
      });
    });

    it('should throw error when user is playing game', async () => {
      GameUser.isUserPlaying = jest.fn().mockResolvedValueOnce(mockGameId);
      await result({
        token: genUserToken(testUserId),
        channelId: testChannelId,
        errorMessage: socketError.AUTH_ERROR,
        gameId: mockGameId,
      });
    });

    it('should throw error when user is not registered', async () => {
      User.exists = jest.fn().mockReturnValueOnce(false);
      ChannelUser.exists = jest.fn().mockReturnValueOnce(true);
      await result({
        token: genUserToken(testUserId),
        channelId: testChannelId,
        errorMessage: socketError.AUTH_USER_NOT_FOUND,
      });
    });

    it('should throw error when user is not in Channel', async () => {
      User.exists = jest.fn().mockReturnValueOnce(true);
      ChannelUser.exists = jest.fn().mockReturnValueOnce(false);
      await result({
        token: genUserToken(testUserId),
        channelId: testChannelId,
        errorMessage: socketError.AUTH_ERROR,
      });
    });

    it('should connect when user is registered and in Channel', async () => {
      User.exists = jest.fn().mockReturnValueOnce(true);
      ChannelUser.exists = jest.fn().mockReturnValueOnce(true);
      await result({
        token: genUserToken(testUserId),
        channelId: testChannelId,
      });
    });
  });

  describe('test connection', () => {
    const result = async (errorOccured: boolean, channelId: string) => {
      User.exists = jest.fn().mockReturnValueOnce(true);
      ChannelUser.exists = jest.fn().mockReturnValueOnce(true);
      const clientSocket = createClientSocket(
        genUserToken(testUserId),
        channelId,
      );

      await new Promise<void>((resolve) => {
        if (errorOccured) {
          clientSocket.on(
            'connect_response',
            (result: { success: boolean }) => {
              expect(result).toEqual({ success: false });
              resolve();
            },
          );
        } else {
          clientSocket.on(
            'connect_response',
            (result: { success: boolean; users: string[] }) => {
              expect(result).toEqual({ success: true, users: [] });
              resolve();
            },
          );
        }

        clientSocket.connect();
      });

      clientSocket.close();
    };

    it('should connect when user is registered and in Channel', async () => {
      await result(false, testChannelId);
    });

    it('should connect when user is registered and in Channel', async () => {
      await result(true, mockChannelId);
    });
  });

  describe('test registerEntry', () => {
    const result = async ({
      connectResponse,
    }: {
      connectResponse: { success: boolean };
    }) => {
      User.exists = jest.fn().mockReturnValueOnce(true);
      ChannelUser.exists = jest.fn().mockReturnValueOnce(true);
      const clientSocket = createClientSocket(
        genUserToken(testUserId),
        testChannelId,
      );

      await new Promise<void>((resolve) => {
        clientSocket.on(
          'connect_response',
          (result: { success: boolean; users: string[] }) => {
            expect(result).toEqual({ success: true, users: [] });
            resolve();
          },
        );

        clientSocket.connect();
      });

      if (!connectResponse.success) delete entryManagers[testChannelId];

      const response = await clientSocket.emitWithAck('registerEntry');
      expect(response.success).toBe(connectResponse.success);

      clientSocket.close();
    };

    it('should register entry when user is registered and in Channel', async () => {
      await result({ connectResponse: { success: true } });
      expect(
        Object.values(entryManagers[testChannelId].users).some(
          (user) => user.userId === testUserId,
        ),
      ).toBe(true);
    });

    it('should throw error when user is not registered', async () => {
      await result({
        connectResponse: { success: false },
      });
    });
  });
  /*   describe('join channel', () => {
    const result = async (errorMessage?: string) => {
      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect_response', (users: string[]) => {
          expect(users).toEqual([]);
          resolve();
        });

        clientSocket.on('authError', (error: { message: string }) => {
          expect(error.message).toBe(errorMessage);
          resolve();
        });

        clientSocket.connect();
      });

      clientSocket.close();
    };

    it('チャンネル参加に成功する', async () => {
      await result();

      expect(entryManagers[testChannelId].channelId).toBe(testChannelId);
    });
  }); */

  /*   describe('register entry', () => {
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
      GameManager.createGameManager = jest.fn().mockResolvedValue(mockGameId);

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
        });

        clientSocket.connect();
      });

      clientSocket.close();

      const entryUsers = entryManagers[testChannelId].getUserList();
      expect(entryUsers).toEqual([]);
    });

    it('ゲーム開始中にエラーが発生したとき', async () => {
      GameManager.createGameManager = jest.fn().mockRejectedValue(new Error());

      entryManagers[testChannelId] = new EntryManager(testChannelId, 1);

      const token = genUserToken(testUserId);
      const clientSocket = createClientSocket(token, testChannelId);

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', async () => {
          clientSocket.on('gameCreationFailed', (error) => {
            expect(error.message).toBe(errors.GAME_CREATION_FAILED);
            resolve();
          });

          await clientSocket.emitWithAck('joinChannel');
          await clientSocket.emitWithAck('registerEntry');
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

        clientSocket.on('authError', (error: { message: string }) => {
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
  }); */
});
