import EventEmitter from 'events';
jest.mock('../../src/app', () => ({
  appState: {
    gameManagers: {},
  },
  Events: {
    channelEvents: new EventEmitter(),
    gameEvents: new EventEmitter(),
  },
}));

import { Socket } from 'socket.io';
import {
  authSocketUser,
  CustomError,
} from '../../src/middleware/authSocketUser';
import User from '../../src/models/User';
import ChannelUser from '../../src/models/ChannelUser';
import GameUser from '../../src/models/GameUser';
import { decodeToken } from '../../src/utils/decodeToken';
import { ObjectId } from 'mongodb';
import { errors } from '../../src/config/messages';

jest.mock('../../src/utils/decodeToken');

describe('authSocketUser', () => {
  let mockSocket: Partial<Socket>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockSocket = {
      handshake: {
        auth: {
          token: 'valid-token',
          channelId: 'valid-channel-id',
        },
        headers: {},
        time: new Date().toISOString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: Date.now(),
        url: '/',
        query: {},
      } as any,
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockNext = jest.fn();

    // デフォルトのモック実装
    (decodeToken as jest.Mock).mockReturnValue({ userId: 'valid-user-id' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('認証に成功する', async () => {
    GameUser.isUserPlaying = jest.fn().mockResolvedValueOnce(null);
    User.exists = jest.fn().mockReturnValueOnce(true);
    ChannelUser.exists = jest.fn().mockReturnValueOnce(true);
    await authSocketUser('entry')(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
    expect((mockSocket as any).userId).toBe('valid-user-id');
    expect((mockSocket as any).channelId).toBe('valid-channel-id');
  });

  it('トークンがない場合、エラーを返す', async () => {
    mockSocket.handshake!.auth.token = undefined;

    await authSocketUser('entry')(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(new Error(errors.AUTH_ERROR));
  });

  it('チャンネルIDがない場合、エラーを返す', async () => {
    mockSocket.handshake!.auth.channelId = undefined;

    await authSocketUser('entry')(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(new Error(errors.AUTH_ERROR));
  });

  it('ユーザーが存在しない場合、エラーを返す', async () => {
    GameUser.isUserPlaying = jest.fn().mockResolvedValueOnce(null);
    User.exists = jest.fn().mockReturnValueOnce(false);
    ChannelUser.exists = jest.fn().mockReturnValueOnce(true);

    await authSocketUser('entry')(mockSocket as Socket, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new Error(errors.AUTH_ERROR));
  });

  it('チャンネルに参加していない場合、エラーを返す', async () => {
    User.exists = jest.fn().mockReturnValueOnce(true);
    ChannelUser.exists = jest.fn().mockReturnValueOnce(false);

    await authSocketUser('entry')(mockSocket as Socket, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new Error(errors.AUTH_ERROR));
  });

  it('別のゲームでプレイ中の場合、エラーを返す', async () => {
    const otherGameId = new ObjectId().toString();
    (GameUser.isUserPlaying as jest.Mock).mockResolvedValue(otherGameId);

    await authSocketUser('entry')(mockSocket as Socket, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new CustomError(otherGameId));
  });
});
