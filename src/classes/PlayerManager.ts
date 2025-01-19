import { shuffle, mapValues, omit } from 'lodash';
import GameUser from '../models/gameUserModel';
import { Role, roleConfig } from '../config/roles';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

export type Status = 'alive' | 'dead';

export interface IUser {
  userId: string;
  userName: string;
}

interface IPlayer {
  userId: string;
  userName: string;
  status: Status;
  role: Role;
}

export default class PlayerManager {
  public gameId: string;
  public players: {
    [key: string]: IPlayer;
  } = {};

  constructor(gameId: string, users: IUser[]) {
    this.gameId = gameId;
    this.setPlayers(users);
  }

  setPlayers(users: IUser[]) {
    const roles = roleConfig[users.length];
    const shuffledRoles = shuffle(roles);

    users.forEach((user) => {
      const { userId, userName } = user;
      const role = shuffledRoles.shift()!;

      this.players[userId] = {
        userId,
        userName,
        status: 'alive',
        role,
      };
    });
  }

  async registerPlayerInDB() {
    const gameId = this.gameId;
    const users = Object.values(this.players).map((user) => ({
      gameId,
      userId: user.userId,
      role: user.role,
    }));

    try {
      await GameUser.insertMany(users);
    } catch (error) {
      console.error('Error registering players:', error);
      throw error;
    }
  }

  kill(userId: string) {
    const player = this.players[userId];
    player.status = 'dead';

    // TODO: チャンネルインスタンスにイベントを送信
  }

  getPlayerState(userId: string) {
    const player = this.players[userId];
    if (!player) return { status: 'spectator', role: 'spectator' };

    const playerState: {
      status: Status;
      role: Role;
      freemasons?: string[];
      werewolves?: string[];
      fox?: string;
      immoralists?: string[];
    } = {
      status: player.status,
      role: player.role,
    };

    // 味方のuserIDを配列に
    if (player.role === 'freemason') {
      playerState.freemasons = Object.values(this.players)
        .filter((user) => user.role === 'freemason')
        .map((user) => user.userId);
    }

    if (player.role === 'werewolf') {
      playerState.werewolves = Object.values(this.players)
        .filter((user) => user.role === 'werewolf')
        .map((user) => user.userId);
    }

    if (player.role === 'immoralist') {
      const players = Object.values(this.players);

      playerState.fox = players.find((user) => user.role === 'fox')?.userId;
      playerState.immoralists = players
        .filter((user) => user.role === 'immoralist')
        .map((user) => user.userId);
    }

    return playerState;
  }

  findPlayerByRole(role: Role): IPlayer {
    const player = Object.values(this.players).find(
      (user) => user.role === role,
    );

    if (!player) throw new AppError(500, gameError.PLAYER_NOT_FOUND);

    return player;
  }

  getImmoralists(): IPlayer[] {
    return Object.values(this.players).filter(
      (user) => user.role === 'immoralist' && user.status === 'alive',
    );
  }

  getLivingPlayers(): IPlayer[] {
    return Object.values(this.players).filter(
      (user) => user.status === 'alive',
    );
  }

  getPlayers() {
    const players = mapValues(this.players, (user) => omit(user, 'userName'));

    return players;
  }

  getPlayersWithoutRole() {
    const players = mapValues(this.players, (user) =>
      omit(user, ['userName', 'role']),
    );

    return players;
  }
}
