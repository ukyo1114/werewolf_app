import EventEmitter from 'events';
// import type EntryManager from '../classes/EntryManager';
// import type ChannelManager from '../classes/ChannelManager';
// import type GameManager from '../classes/GameManager';

export const appState: {
  entryManagers: Record<string, any>;
  channelManagers: Record<string, any>;
  gameManagers: Record<string, any>;
} = {
  entryManagers: {},
  channelManagers: {},
  gameManagers: {},
};

export const Events: Record<string, EventEmitter> = {
  entryEvents: new EventEmitter(),
  channelEvents: new EventEmitter(),
  gameEvents: new EventEmitter(),
};
