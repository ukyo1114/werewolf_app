import _ from 'lodash';
import GameManager from './GameManager';
import ChannelUserManager from './ChannelUserManager';
import { IChannelUser, MessageType } from '../config/types';
import { appState } from '../app';

const { channelManagers } = appState;

export default class ChannelManager {
  public channelId: string;
  public users: Record<string, ChannelUserManager>;
  public game: GameManager | null = null;

  constructor(channelId: string, game?: GameManager) {
    this.channelId = channelId;
    this.users = {};
    this.game = game || null;
  }

  async userJoined(userId: string, socketId: string): Promise<void> {
    const game = this.game;
    const user: IChannelUser = { userId, socketId, status: 'normal' };

    if (game) {
      const player = game.playerManager.players[userId];
      const isSpectator = !player || player.status !== 'alive';

      if (isSpectator) {
        user.status = 'spectator';
      } else if (player.role === 'werewolf') {
        user.status = 'werewolf';
      }
    }

    this.users[userId] = new ChannelUserManager(user);
  }

  userLeft(userId: string) {
    delete this.users[userId];
    if (Object.keys(this.users).length === 0)
      delete channelManagers[this.channelId];
  }

  getSendMessageType(userId: string) {
    this.checkCanUserAccessChannel(userId);
    const user = this.users[userId];

    const game = this.game;
    if (!game) return 'normal';

    const { currentPhase } = game.phaseManager;

    if (currentPhase === 'finished') return 'normal';
    if (user.status === 'spectator') return 'spectator';
    if (currentPhase !== 'night') {
      return 'normal';
    } else if (user.status === 'werewolf') {
      return 'werewolf';
    }

    throw new Error();
  }

  getMessageReceivers(messageType: MessageType): string[] | null {
    if (messageType === 'normal') return null;

    const spectators = this.getSpectators();

    if (messageType === 'spectator') return spectators;

    const werewolves = this.getWerewolves();
    return _.union(spectators, werewolves);
  }

  getSpectators(): string[] {
    return Object.values(this.users)
      .filter((user) => user.status === 'spectator')
      .map((user) => user.socketId);
  }

  getWerewolves(): string[] {
    return Object.values(this.users)
      .filter((user) => user.status === 'werewolf')
      .map((user) => user.socketId);
  }

  getReceiveMessageType(userId: string): { $in: MessageType[] } | null {
    this.checkCanUserAccessChannel(userId);
    const user = this.users[userId];

    const game = this.game;
    if (!game) return null;

    const { currentPhase } = game.phaseManager;

    if (currentPhase === 'finished' || user.status === 'spectator') return null;
    if (user.status === 'normal') return { $in: ['normal'] };
    return { $in: ['normal', 'werewolf'] };
  }

  checkCanUserAccessChannel(userId: string) {
    if (!this.users[userId]) throw new Error();
  }
}
