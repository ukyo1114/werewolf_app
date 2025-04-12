import { Document, Types } from 'mongoose';
import { gameError } from './messages';

export type Role =
  | 'villager'
  | 'seer'
  | 'medium'
  | 'hunter'
  | 'freemason'
  | 'werewolf'
  | 'madman'
  | 'fox'
  | 'immoralist'
  | 'fanatic'
  | 'spectator';

export type RoleConfig = Record<number, Role[]>;

export interface IChannelUser {
  userId: string;
  socketId: string;
  status: MessageType;
}

export type EntryUsers = { userId: string; userName: string }[];

export type GameResult =
  | 'running'
  | 'villagersWin'
  | 'werewolvesWin'
  | 'foxesWin'
  | 'villageAbandoned';
export interface IGameResult {
  value: GameResult;
}

export interface IGameState {
  gameId: string;
  phase: {
    currentDay: number;
    currentPhase: CurrentPhase;
    changedAt: Date;
  };
  users: Record<string, IPlayerState>;
}

export interface IUser {
  userId: string;
  userName: string;
}

export interface IPlayer {
  userId: string;
  userName: string;
  status: Status;
  role: Role;
  teammates: string[] | null;
}

export interface IPlayerState {
  status: Status;
  role?: Role;
  teammates?: string[] | null;
}

export type Status = 'alive' | 'dead' | 'spectator';
export type CurrentPhase = 'pre' | 'day' | 'night' | 'finished';

type Team = 'villagers' | 'werewolves';
export type DevineResult = Record<number, Record<string, Team>>;
export type MediumResult = Record<number, Record<string, Team>>;
export type GuardHistory = Record<number, string>;
export type AttackHistory = Record<number, string>;

export type VotesByVotee = Record<string, string[]>;
export type VoteHistory = Record<number, VotesByVotee>;

export type MessageType = 'normal' | 'werewolf' | 'spectator' | 'freemason';
export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  messageType: MessageType;
  createdAt: Date;
}
