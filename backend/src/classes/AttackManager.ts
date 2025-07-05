import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { AttackHistory } from '../config/types';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

export default class AttackManager {
  public attackRequest: string | null = null;
  public attackHistory: AttackHistory = {};
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveAttackRequest(playerId: string, targetId: string): void {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[playerId];
    const target = this.playerManager.players[targetId];
    const isNightPhase = currentPhase === 'night';
    const isPlayerValid =
      player && player.status === 'alive' && player.role === 'werewolf';
    const isTargetValid =
      target && target.status === 'alive' && target.role !== 'werewolf';
    if (!isNightPhase || !isPlayerValid || !isTargetValid)
      throw new AppError(400, errors.REQUEST_FAILED);
    this.attackRequest = targetId;
  }

  decideAttackTarget(): string | undefined {
    const { currentDay } = this.phaseManager;
    const attackTargetId =
      this.attackRequest || this.playerManager.getRandomTarget('werewolf');
    if (!attackTargetId) return;
    this.attackHistory[currentDay] = attackTargetId;
    this.attackRequest = null;
    return attackTargetId;
  }

  async attack(
    guardTargetId: string | undefined = undefined,
  ): Promise<string | undefined> {
    const attackTargetId = this.decideAttackTarget();
    const guardSucceeded = attackTargetId === guardTargetId;
    if (!attackTargetId || guardSucceeded) return;
    // 狐を襲撃した場合失敗する
    const { userName, role } = this.playerManager.players[attackTargetId];
    if (role === 'fox') return;
    await this.playerManager.kill(attackTargetId);
    return userName;
  }

  getAttackHistory(userId: string): AttackHistory {
    this.playerManager.validatePlayerByRole(userId, 'werewolf');
    return this.attackHistory;
  }
}
