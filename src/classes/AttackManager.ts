import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import GuardManager from './GuardManager';
import { AttackHistory } from '../config/types';

export default class AttackManager {
  public attackRequest: string | null = null;
  public attackHistory: AttackHistory = {};
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public guardManager: GuardManager;

  constructor(
    phaseManager: PhaseManager,
    playerManager: PlayerManager,
    guardManager: GuardManager,
  ) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
    this.guardManager = guardManager;
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
    if (!isNightPhase || !isPlayerValid || !isTargetValid) throw new Error();
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

  async attack(): Promise<string | undefined> {
    const attackTargetId = this.decideAttackTarget();
    if (!attackTargetId) return;
    // 狐を襲撃した場合失敗する
    const { userName, role } = this.playerManager.players[attackTargetId];
    if (role === 'fox') return;
    // 護衛判定
    const hunter = this.playerManager.getLivingPlayers('hunter');
    if (hunter.length > 0) {
      const guardResult = this.guardManager.guard(attackTargetId);
      if (guardResult) return;
    }
    await this.playerManager.kill(attackTargetId);
    return userName;
  }

  getAttackHistory(userId: string): AttackHistory {
    this.playerManager.validatePlayerByRole(userId, 'werewolf');
    return this.attackHistory;
  }
}
