import AppError from '@/utils/AppError';
import { errors } from '@/config/messages';
import { Role } from '../classTypes';
import PhaseManager from '../PhaseManager';
import PlayerManager from '../PlayerManager';

export abstract class BaseRoleManager<T> {
  protected phaseManager: PhaseManager;
  protected playerManager: PlayerManager;
  protected abstract readonly roleName: Role;
  protected abstract request: string | null;
  protected abstract history: T;

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  public receiveRequest(playerId: string, targetId: string): void {
    this.validateRequest(playerId, targetId, this.roleName);
    this.request = targetId;
  }

  public getResult(userId: string): T {
    this.playerManager.validatePlayerByRole(userId, this.roleName);
    return this.history;
  }

  protected decideTarget(): string {
    const targetId =
      this.request || this.playerManager.getRandomTarget(this.roleName);
    this.request = null;
    return targetId;
  }

  protected validateNightPhase(): void {
    if (this.phaseManager.currentPhase !== 'night') {
      throw new AppError(400, errors.REQUEST_FAILED);
    }
  }

  protected validatePlayer(playerId: string, expectedRole: Role): void {
    const player = this.playerManager.players[playerId];
    if (!player || player.status !== 'alive' || player.role !== expectedRole) {
      throw new AppError(400, errors.REQUEST_FAILED);
    }
  }

  protected validateTarget(targetId: string, excludeRole: Role): void {
    const target = this.playerManager.players[targetId];
    if (!target || target.status !== 'alive' || target.role === excludeRole) {
      throw new AppError(400, errors.REQUEST_FAILED);
    }
  }

  protected validateRequest(
    playerId: string,
    targetId: string,
    expectedRole: Role,
  ): void {
    this.validateNightPhase();
    this.validatePlayer(playerId, expectedRole);
    this.validateTarget(targetId, expectedRole);
  }

  protected getLivingPlayers(role: Role): any[] {
    return this.playerManager.getLivingPlayers(role);
  }

  protected getRandomTarget(role: Role): string | undefined {
    return this.playerManager.getRandomTarget(role);
  }

  protected getCurrentDay(): number {
    return this.phaseManager.currentDay;
  }

  protected getCurrentPhase(): string {
    return this.phaseManager.currentPhase;
  }
}
