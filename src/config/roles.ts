import { RoleConfig } from './types';

export const roleConfig: RoleConfig = {
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

export const teammateMapping: Record<string, string> = {
  werewolf: 'werewolf',
  freemason: 'freemason',
  immoralist: 'fox',
  fanatic: 'werewolf',
};
