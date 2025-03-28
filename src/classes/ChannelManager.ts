import { union } from 'lodash';
import GameManager from './GameManager';
import ChannelUserManager, { IChannelUser } from './ChannelUserManager';
import ChannelUser from '../models/channelUserModel';
import { MessageType } from '../models/messageModel';
import GameUser from '../models/gameUserModel';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { appState } from '../app';

const { channelManagers } = appState;

export default class ChannelManager {
  public channelId: string;
  public users: {
    [key: string]: ChannelUserManager;
  };
  public game: GameManager | undefined;

  constructor(channelId: string, game?: GameManager) {
    this.channelId = channelId;
    this.users = {};
    this.game = game;
  }

  async userJoined(userId: string, socketId: string) {
    // const channelId = this.channelId;
    const game = this.game;

    /*     const userExists = game
      ? await GameUser.exists({ gameId: channelId, userId })
      : await ChannelUser.exists({ channelId, userId });
    if (!userExists) throw new Error(); */

    const user: IChannelUser = { userId, socketId, status: 'normal' };

    if (game) {
      const player = game.playerManager.players[userId];

      if (!player || player.status !== 'alive') {
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

    throw new AppError(403, errors.MESSAGE_SENDING_FORBIDDEN);
  }

  getMessageReceivers(messageType: MessageType): string[] | null {
    if (messageType === 'normal') return null;

    const spectators = this.getSpectators();

    if (messageType === 'spectator') return spectators;

    const werewolves = this.getWerewolves();
    return union(spectators, werewolves);
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
    if (!this.users[userId])
      throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);
  }
}
