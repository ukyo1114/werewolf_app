import EventEmitter from 'events';
import ChannelUserManager from '../../src/classes/ChannelUserManager';
import { IChannelUser } from '../../src/config/types';
import { mockUserId } from '../../jest.setup';

const mockUser: IChannelUser = {
  userId: mockUserId,
  socketId: 'mockSocketId',
  status: 'normal',
};

describe('ChannelUserManager', () => {
  it('The instance is initialized correctly', () => {
    const spyRegisterListners = jest.spyOn(
      ChannelUserManager.prototype,
      'registerListners',
    );
    const user = new ChannelUserManager(mockUser);

    expect(user.userId).toBe(mockUserId);
    expect(user.socketId).toBe('mockSocketId');
    expect(user.status).toBe('normal');
    expect(user.eventEmitter).toBeInstanceOf(EventEmitter);
    expect(spyRegisterListners).toHaveBeenCalled();
  });

  it('The status changes due to the kill event', () => {
    const user = new ChannelUserManager(mockUser);
    expect(user.status).toBe('normal');

    user.eventEmitter.emit('kill');
    expect(user.status).toBe('spectator');
  });
});
