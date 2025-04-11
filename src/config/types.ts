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

export type AttackHistory = Record<number, string>;
