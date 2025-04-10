import { ObjectId } from 'mongodb';
import { IUser, IPlayer } from '../src/classes/PlayerManager';

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

export const gamePlayers: Record<string, IPlayer> = {
  villager: {
    userId: 'villager',
    userName: 'villager',
    status: 'alive',
    role: 'villager',
    teammates: null,
  },
  seer: {
    userId: 'seer',
    userName: 'seer',
    status: 'alive',
    role: 'seer',
    teammates: null,
  },
  medium: {
    userId: 'medium',
    userName: 'medium',
    status: 'alive',
    role: 'medium',
    teammates: null,
  },
  hunter: {
    userId: 'hunter',
    userName: 'hunter',
    status: 'alive',
    role: 'hunter',
    teammates: null,
  },
  werewolf: {
    userId: 'werewolf',
    userName: 'werewof',
    status: 'alive',
    role: 'werewolf',
    teammates: null,
  },
  fox: {
    userId: 'fox',
    userName: 'fox',
    status: 'alive',
    role: 'fox',
    teammates: null,
  },
};
