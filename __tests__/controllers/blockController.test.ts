import { ObjectId } from 'mongodb';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import ChannelBlockUser from '../../src/models/ChannelBlockUser';

describe('test blockControlelr', () => {
  const adminId = new ObjectId().toString();
  const nonAdminId = new ObjectId().toString();
  const blockedUserId = new ObjectId().toString();
  const channelId = new ObjectId().toString();

  beforeEach(async () => {
    await Promise.all([
      User.create({
        _id: blockedUserId,
        userName: 'BlockedUser',
        email: 'blocked@example.com',
        password: 'password',
      }),
      Channel.create({
        channelName: 'test',
        channelDescription: 'test',
        channelAdmin: adminId,
      }),
      ChannelBlockUser.create({
        channelId,
        blockedUserId,
      }),
    ]);
  });

  afterEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Channel.deleteMany({}),
      ChannelBlockUser.deleteMany({}),
    ]);
  });

  describe("test getBlockUserList", () => {
});
