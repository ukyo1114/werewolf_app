import _ from 'lodash';

import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { appState } from '../config/appState';
import { IChannelUser, MessageType } from '../config/types';
import ChannelManager from './ChannelManager';
import GameManager from './GameManager';

const { channelManagers, gameManagers } = appState;

export default class GameChannelManager extends ChannelManager {
  protected game: GameManager;

  constructor(gameId: string, game: GameManager) {
    super(gameId);
    this.game = game;
  }

  static async createChannelInstance(
    gameId: string,
  ): Promise<GameChannelManager> {
    const game = gameManagers[gameId];
    if (!game) throw new Error();
    return (channelManagers[gameId] = new GameChannelManager(gameId, game));
  }

  userJoined(userId: string, socketId: string): void {
    const game = this.game;
    const player = game.playerManager.players[userId];
    const isSpectator = !player || player.status !== 'alive';

    const user: IChannelUser = { userId, socketId, status: 'normal' };

    if (isSpectator) {
      user.status = 'spectator';
    } else if (player.role === 'werewolf') {
      user.status = 'werewolf';
    } else if (player.role === 'freemason') {
      user.status = 'freemason';
    }

    this.users[userId] = new this.ChannelUserManager(user);
  }

  getSendMessageType(userId: string): MessageType {
    this.checkCanUserAccessChannel(userId);
    const user = this.users[userId];
    const { currentPhase } = this.game.phaseManager;

    if (currentPhase === 'finished') return 'normal';
    if (user.status === 'spectator') return 'spectator';
    if (currentPhase !== 'night') {
      return 'normal';
    } else if (user.status === 'werewolf') {
      return 'werewolf';
    } else if (user.status === 'freemason') {
      return 'freemason';
    }

    throw new AppError(403, errors.MESSAGE_SENDING_FORBIDDEN);
  }

  getMessageReceivers(messageType: MessageType): string[] {
    if (messageType === 'normal' || messageType === 'system') return [];
    const spectators = this.getUsersByStatus('spectator');
    if (messageType === 'spectator') return spectators;
    if (messageType === 'freemason') {
      const freemasons = this.getUsersByStatus('freemason');
      return _.union(spectators, freemasons);
    } else if (messageType === 'werewolf') {
      const werewolves = this.getUsersByStatus('werewolf');
      return _.union(spectators, werewolves);
    }
    throw new Error();
  }

  protected getUsersByStatus(status: MessageType): string[] {
    return Object.values(this.users)
      .filter((user) => user.status === status)
      .map((user) => user.socketId);
  }

  getReceiveMessageType(userId: string): MessageType[] | undefined {
    this.checkCanUserAccessChannel(userId);
    const user = this.users[userId];
    const { currentPhase } = this.game.phaseManager;

    if (currentPhase === 'finished' || user.status === 'spectator') return;
    if (user.status === 'normal') return ['normal'];
    if (user.status === 'freemason') return ['normal', 'freemason'];
    return ['normal', 'werewolf'];
  }
}
