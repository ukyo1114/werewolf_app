import EventEmitter from 'events';
import ChannelUserManager from '../../src/classes/ChannelUserManager';
import { IChannelUser } from '../../src/config/types';
import { mockUserId } from '../../__mocks__/mockdata';

const mockUser: IChannelUser = {
  userId: mockUserId,
  socketId: 'mockSocketId',
  status: 'normal',
};

describe('ChannelUserManager', () => {
  it('The instance is initialized correctly', () => {
    const user = new ChannelUserManager(mockUser);

    expect(user.userId).toBe(mockUserId);
    expect(user.socketId).toBe('mockSocketId');
    expect(user.status).toBe('normal');
  });

  it('test kill', () => {
    const user = new ChannelUserManager(mockUser);
    expect(user.status).toBe('normal');

    user.kill();
    expect(user.status).toBe('spectator');
  });
});
