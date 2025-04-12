import { Document, Types } from 'mongoose';
import { Request, Response } from 'express';

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

// settings for controllers
export interface CustomRequest<TBody = {}, TParams = {}, TQuery = {}>
  extends Request<TParams, any, TBody, TQuery> {
  userId?: string;
}

export interface ISelectedUser {
  selectedUser: string;
}

export interface ICreateChannel {
  channelName: string;
  channelDescription: string;
  passwordEnabled: boolean;
  password?: string;
  denyGuests: boolean;
  numberOfPlayers: number;
}

export interface IChannelSettings {
  channelName: string | null;
  channelDescription: string | null;
  passwordEnabled: boolean;
  password: string | null;
  denyGuests: boolean;
  numberOfPlayers: number;
}

export interface IRegisterUser {
  userName: string;
  password: string;
  token: string;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface IUpdateProfile {
  userName: string | null;
  pic: string | null;
}

export interface IUpdateEmail {
  token: string;
}

export interface IChangePassword {
  currentPassword: string;
  newPassword: string;
}

export interface IResetPassword {
  password: string;
  token: string;
}
