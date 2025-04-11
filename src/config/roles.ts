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

interface IRoleConfig {
  [key: string]: Role[];
}

export const roleConfig: IRoleConfig = {
  10: [
    'villager',
    'villager',
    'villager',
    'villager',
    'seer',
    'medium',
    'hunter',
    'werewolf',
    'werewolf',
    'madman',
  ],
  11: [
    'villager',
    'villager',
    'villager',
    'villager',
    'villager',
    'seer',
    'medium',
    'hunter',
    'werewolf',
    'werewolf',
    'madman',
  ],
};
