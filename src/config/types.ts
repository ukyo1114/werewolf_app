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

type Team = 'villagers' | 'werewolves';
export type DevineResult = Record<number, Record<string, Team>>;
export type AttackHistory = Record<number, string>;

export type MessageType = 'normal' | 'werewolf' | 'spectator' | 'freemason';
