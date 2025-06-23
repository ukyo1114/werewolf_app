import _ from 'lodash';
import { roleConfig, teammateMapping } from '../config/roles';
import { Role, Status, IUser, IPlayer, IPlayerState } from '../config/types';
import { appState } from '../app';
import GameUser from '../models/GameUser';

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

  async kill(userId: string): Promise<void> {
    const player = this.players[userId];
    player.status = 'dead';
    channelManagers[this.gameId]?.users[userId]?.kill();
    try {
      await GameUser.updateOne(
        { gameId: this.gameId, userId },
        { isPlaying: false },
      );
    } catch (error) {
      console.error(`Failed to update game user ${userId}:`, error);
    }
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

  getLivingPlayers(filterRole: Role | undefined = undefined): IPlayer[] {
    return Object.values(this.players).filter((user) =>
      filterRole
        ? user.role === filterRole && user.status === 'alive'
        : user.status === 'alive',
    );
  }

  getPlayersInfo(withRole: boolean): Record<string, IPlayerState> {
    const players = _.mapValues(this.players, (user) =>
      withRole
        ? _.omit(user, ['userName', 'teammates'])
        : _.omit(user, ['userName', 'role', 'teammates']),
    );

    return players;
  }

  getRandomTarget(excludedRole: Role | undefined): string | undefined {
    const players = this.players;
    const randomTargets = Object.values(players)
      .filter(
        (player) =>
          player.status === 'alive' &&
          (!excludedRole || player.role !== excludedRole),
      )
      .map((player) => player.userId);

    const target = _.sample(randomTargets);
    if (!target) return;

    return target;
  }

  validatePlayerByRole(userId: string, role: Role): void {
    const player = this.players[userId];
    if (!player || player.role !== role) throw new Error();
  }
}
