import EventEmitter from 'events';
import ChannelUserManager, {
  IChannelUser,
} from '../../src/classes/ChannelUserManager';

describe('test ChannelUserManager', () => {
  const mockUserId = 'mockUserId';
  const mockSocketId = 'mockSocketId';
  const mockUser: IChannelUser = {
    userId: mockUserId,
    socketId: mockSocketId,
    status: 'normal',
  };
  /*   const channelUser: {
    [key: string]: ChannelUserManager;
  } = {};

  beforeEach(() => {
    channelUser[mockUserId] = new ChannelUserManager(mockUser);
  });

  afterAll(() => {
    delete channelUser[mockUserId];
  }); */

  it('正しい形式で初期化されること', () => {
    const spyRegisterListners = jest.spyOn(
      ChannelUserManager.prototype,
      'registerListners',
    );
    const user = new ChannelUserManager(mockUser);

    expect(user.userId).toBe(mockUserId);
    expect(user.socketId).toBe(mockSocketId);
    expect(user.status).toBe('normal');
    expect(user.eventEmitter).toBeInstanceOf(EventEmitter);
    expect(spyRegisterListners).toHaveBeenCalled();
  });

  it('イベントリスナーが登録されること', () => {
    const user = new ChannelUserManager(mockUser);
    const mockOn = jest.spyOn(user.eventEmitter, 'on');

    user.registerListners();

    expect(mockOn).toHaveBeenCalledWith('kill', expect.any(Function));

    mockOn.mockRestore();
  });

  it('killイベントを受け取るとstatusがspectatorへと変化すること', () => {
    const user = new ChannelUserManager(mockUser);

    expect(user.status).toBe('normal');

    user.eventEmitter.emit('kill');

    expect(user.status).toBe('spectator');
  });
});
