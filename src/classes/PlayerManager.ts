import _ from 'lodash';
import GameUser from '../models/gameUserModel';
import { Role, roleConfig } from '../config/roles';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

export type Status = 'alive' | 'dead' | 'spectator';

export interface IUser {
  userId: string;
  userName: string;
}

interface IPlayer {
  userId: string;
  userName: string;
  status: Status;
  role: Role;
  teammates: string[] | null;
}

export default class PlayerManager {
  public gameId: string;
  public players: Record<string, IPlayer> = {};

  constructor(gameId: string, users: IUser[]) {
    this.gameId = gameId;
    this.setPlayers(users);
    this.setTeammates();
  }

  setPlayers(users: IUser[]) {
    const roles = roleConfig[users.length];
    const shuffledRoles = _.shuffle(roles);

    users.forEach((user) => {
      const { userId, userName } = user;
      const role = shuffledRoles.shift();
      if (!role) throw new Error();

      this.players[userId] = {
        userId,
        userName,
        status: 'alive',
        role,
        teammates: null,
      };
    });
  }

  setTeammates() {
    const teammateMapping: Record<string, string> = {
      werewolf: 'werewolf',
      freemason: 'freemason',
      immoralist: 'fox',
      fanatic: 'warewolf',
    };

    Object.keys(this.players).forEach((plId) => {
      const player = this.players[plId];
      const targetRole = teammateMapping[player.role];

      if (targetRole) {
        player.teammates = Object.values(this.players)
          .filter((user) => user.role === targetRole)
          .map((user) => user.userId);
      }
    });
  }

  async registerPlayersInDB() {
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
      teammates: string[] | null;
    } = {
      status: player.status,
      role: player.role,
      teammates: player.teammates,
    };

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

  getPlayersWithRole() {
    const players = _.mapValues(this.players, (user) =>
      _.omit(user, 'userName'),
    );

    return players;
  }

  getPlayersWithoutRole() {
    const players = _.mapValues(this.players, (user) =>
      _.omit(user, ['userName', 'role']),
    );

    return players;
  }

  getRandomTarget(excludedRole: Role | undefined): string {
    const players = this.players;
    const randomTargets = Object.values(players)
      .filter(
        (player) =>
          player.status === 'alive' &&
          (!excludedRole || player.role !== excludedRole),
      )
      .map((player) => player.userId);

    const target = _.sample(randomTargets);
    if (!target) throw new Error();

    return target;
  }
}
