import _ from 'lodash';
import GameManager from './GameManager';
import ChannelUserManager from './ChannelUserManager';
import { IChannelUser, MessageType } from '../config/types';
import { appState } from '../app';
import Channel from '../models/Channel';
import Game from '../models/Game';
import { errors } from '../config/messages';
import AppError from '../utils/AppError';

const { channelManagers, gameManagers } = appState;

export default class ChannelManager {
  public channelId: string;
  public users: Record<string, ChannelUserManager>;
  public game: GameManager | undefined = undefined;

  constructor(channelId: string, game: GameManager | undefined = undefined) {
    this.channelId = channelId;
    this.users = {};
    this.game = game;
  }

  static async createChannelInstance(
    channelId: string,
  ): Promise<ChannelManager> {
    try {
      const [isChannel, isGame] = await Promise.all([
        Channel.exists({ _id: channelId }),
        Game.exists({ _id: channelId }),
      ]);
      if (!isChannel && !isGame) throw new Error();
      if (isChannel) {
        return (channelManagers[channelId] = new ChannelManager(channelId));
      } else {
        const game = gameManagers[channelId];
        if (!game) throw new Error();
        return (channelManagers[channelId] = new ChannelManager(
          channelId,
          game,
        ));
      }
    } catch (error) {
      throw new Error(errors.CHANNEL_CREATION_FAILED);
    }
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
      } else if (player.role === 'freemason') {
        user.status = 'freemason';
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
    try {
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
      } else if (user.status === 'freemason') {
        return 'freemason';
      }

      throw new Error();
    } catch {
      throw new AppError(403, errors.MESSAGE_SENDING_FORBIDDEN);
    }
  }

  getMessageReceivers(messageType: MessageType): string[] {
    if (messageType === 'normal' || messageType === 'system') return [];
    const spectators = this.getUsersByStatus('spectator');
    if (messageType === 'spectator') return spectators;
    if (messageType === 'freemason') {
      const freemasons = this.getUsersByStatus('freemason');
      return _.union(spectators, freemasons);
    } else {
      const werewolves = this.getUsersByStatus('werewolf');
      return _.union(spectators, werewolves);
    }
  }

  getUsersByStatus(status: MessageType): string[] {
    return Object.values(this.users)
      .filter((user) => user.status === status)
      .map((user) => user.socketId);
  }

  getReceiveMessageType(userId: string): MessageType[] | undefined {
    this.checkCanUserAccessChannel(userId);
    const user = this.users[userId];

    const game = this.game;
    if (!game) return;
    const { currentPhase } = game.phaseManager;

    if (currentPhase === 'finished' || user.status === 'spectator') return;
    if (user.status === 'normal') return ['normal'];
    if (user.status === 'freemason') return ['normal', 'freemason'];
    return ['normal', 'werewolf'];
  }

  checkCanUserAccessChannel(userId: string) {
    if (!this.users[userId]) throw new Error();
  }
}
