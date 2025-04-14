import _ from 'lodash';
import GameUser from '../models/gameUserModel';
import { roleConfig, teammateMapping } from '../config/roles';
import { Role, Status, IUser, IPlayer, IPlayerState } from '../config/types';
import { appState } from '../app';

const { channelManagers } = appState;

export default class PlayerManager {
  public gameId: string;
  public players: Record<string, IPlayer> = {};

  constructor(gameId: string, users: IUser[]) {
    this.gameId = gameId;
    this.setPlayers(users);
    this.setTeammates();
  }

  setPlayers(users: IUser[]): void {
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

  setTeammates(): void {
    Object.keys(this.players).forEach((playerId) => {
      const player = this.players[playerId];
      const targetRole = teammateMapping[player.role];

      if (targetRole) {
        player.teammates = Object.values(this.players)
          .filter((user) => user.role === targetRole)
          .map((user) => user.userId);
      }
    });
  }

  async registerPlayersInDB(): Promise<void> {
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

  kill(userId: string): void {
    const player = this.players[userId];
    player.status = 'dead';

    channelManagers[this.gameId]?.users[userId]?.kill();
  }

  getPlayerState(userId: string): {
    status: Status;
    role: Role;
    teammates: string[] | null;
  } {
    const player = this.players[userId];
    if (!player)
      return { status: 'spectator', role: 'spectator', teammates: null };

    const playerState = {
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
    if (!player) throw new Error();

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

  getPlayersWithRole(): Record<string, IPlayerState> {
    const players = _.mapValues(this.players, (user) =>
      _.omit(user, ['userName', 'teammates']),
    );

    return players;
  }

  getPlayersWithoutRole(): Record<string, IPlayerState> {
    const players = _.mapValues(this.players, (user) =>
      _.omit(user, ['userName', 'role', 'teammates']),
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
