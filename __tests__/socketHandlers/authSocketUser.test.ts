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
import { authSocketUser } from '../../src/middleware/authSocketUser';
import User from '../../src/models/User';
import ChannelUser from '../../src/models/ChannelUser';
import GameUser from '../../src/models/GameUser';
import GameManager from '../../src/classes/GameManager';
import { decodeToken } from '../../src/utils/decodeToken';
import { ObjectId } from 'mongodb';

jest.mock('../../src/models/User');
jest.mock('../../src/models/ChannelUser');
jest.mock('../../src/models/GameUser');
jest.mock('../../src/classes/GameManager');
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
    (User.exists as jest.Mock).mockResolvedValue(true);
    (ChannelUser.exists as jest.Mock).mockResolvedValue(true);
    (GameUser.exists as jest.Mock).mockResolvedValue(true);
    (GameManager.isUserPlayingGame as jest.Mock).mockReturnValue(null);
    (decodeToken as jest.Mock).mockReturnValue({ userId: 'valid-user-id' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('認証に成功する', async () => {
    await authSocketUser(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
    expect((mockSocket as any).userId).toBe('valid-user-id');
    expect((mockSocket as any).channelId).toBe('valid-channel-id');
  });

  it('トークンがない場合、エラーを返す', async () => {
    mockSocket.handshake!.auth.token = undefined;

    await authSocketUser(mockSocket as Socket, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('authError', null);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('チャンネルIDがない場合、エラーを返す', async () => {
    mockSocket.handshake!.auth.channelId = undefined;

    await authSocketUser(mockSocket as Socket, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('authError', null);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('ユーザーが存在しない場合、エラーを返す', async () => {
    (User.exists as jest.Mock).mockResolvedValue(false);

    await authSocketUser(mockSocket as Socket, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('authError', null);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('チャンネルに参加していない場合、エラーを返す', async () => {
    (ChannelUser.exists as jest.Mock).mockResolvedValue(false);

    await authSocketUser(mockSocket as Socket, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('authError', null);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('ゲームに参加していない場合、エラーを返す', async () => {
    (GameUser.exists as jest.Mock).mockResolvedValue(false);

    await authSocketUser(mockSocket as Socket, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('authError', null);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('別のゲームでプレイ中の場合、エラーを返す', async () => {
    const otherGameId = new ObjectId().toString();
    (GameManager.isUserPlayingGame as jest.Mock).mockReturnValue(otherGameId);

    await authSocketUser(mockSocket as Socket, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('authError', otherGameId);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
