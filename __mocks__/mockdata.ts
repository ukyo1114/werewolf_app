import { ObjectId } from 'mongodb';
import { IUser, IPlayer } from '../src/config/types';
import ChannelUserManager from '../src/classes/ChannelUserManager';

export const mockUserId = new ObjectId().toString();
export const mockChannelId = new ObjectId().toString();
export const mockGameId = new ObjectId().toString();

export const mockUsers: IUser[] = [
  { userId: new ObjectId().toString(), userName: 'Alice' },
  { userId: new ObjectId().toString(), userName: 'Bob' },
  { userId: new ObjectId().toString(), userName: 'Charlie' },
  { userId: new ObjectId().toString(), userName: 'Diana' },
  { userId: new ObjectId().toString(), userName: 'Eve' },
  { userId: new ObjectId().toString(), userName: 'Frank' },
  { userId: new ObjectId().toString(), userName: 'Grace' },
  { userId: new ObjectId().toString(), userName: 'Hank' },
  { userId: new ObjectId().toString(), userName: 'Ivy' },
  { userId: new ObjectId().toString(), userName: 'Jack' },
];

export const gamePlayers = (): Record<string, IPlayer> => ({
  villager: {
    userId: 'villager',
    userName: 'villager',
    status: 'alive',
    role: 'villager',
    teammates: [],
  },
  seer: {
    userId: 'seer',
    userName: 'seer',
    status: 'alive',
    role: 'seer',
    teammates: [],
  },
  medium: {
    userId: 'medium',
    userName: 'medium',
    status: 'alive',
    role: 'medium',
    teammates: [],
  },
  hunter: {
    userId: 'hunter',
    userName: 'hunter',
    status: 'alive',
    role: 'hunter',
    teammates: [],
  },
  freemason: {
    userId: 'freemason',
    userName: 'freemason',
    status: 'alive',
    role: 'freemason',
    teammates: [],
  },
  werewolf: {
    userId: 'werewolf',
    userName: 'werewof',
    status: 'alive',
    role: 'werewolf',
    teammates: [],
  },
  werewolf2: {
    userId: 'werewolf2',
    userName: 'werewof2',
    status: 'alive',
    role: 'werewolf',
    teammates: [],
  },
  fanatic: {
    userId: 'fanatic',
    userName: 'fanatic',
    status: 'alive',
    role: 'fanatic',
    teammates: [],
  },
  fox: {
    userId: 'fox',
    userName: 'fox',
    status: 'alive',
    role: 'fox',
    teammates: [],
  },
  immoralist: {
    userId: 'immoralist',
    userName: 'immoralist',
    status: 'alive',
    role: 'immoralist',
    teammates: [],
  },
});

export const channelUsers = () => ({
  normal: new ChannelUserManager({
    userId: 'normal',
    socketId: 'normal',
    status: 'normal',
  }),
  spectator: new ChannelUserManager({
    userId: 'spectator',
    socketId: 'spectator',
    status: 'spectator',
  }),
  werewolf: new ChannelUserManager({
    userId: 'werewolf',
    socketId: 'werewolf',
    status: 'werewolf',
  }),
});

export const mockChannelUser = () => ({
  [mockUserId]: new ChannelUserManager({
    userId: mockUserId,
    socketId: 'testSocketId',
    status: 'normal',
  }),
});
