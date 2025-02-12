import EventEmitter from 'events';
import ChannelUserManager, {
  IChannelUser,
} from '../../src/classes/ChannelUserManager';
import { mockUserId } from '../../jest.setup';

const mockSocketId = 'mockSocketId';
const mockUser: IChannelUser = {
  userId: mockUserId,
  socketId: mockSocketId,
  status: 'normal',
};

describe('ChannelUserManager', () => {
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

  it('killイベントを受け取りステータスが変化すること', () => {
    const user = new ChannelUserManager(mockUser);

    expect(user.status).toBe('normal');

    user.eventEmitter.emit('kill');

    expect(user.status).toBe('spectator');
  });
});
