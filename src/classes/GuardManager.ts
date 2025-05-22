import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import { GuardHistory } from '../config/types';

export default class GuardManager {
  public guardRequest: string | null = null;
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public guardHistory: GuardHistory = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveGuradRequest(playerId: string, targetId: string): void {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[playerId];
    const target = this.playerManager.players[targetId];

    const isNightPhase = currentPhase === 'night';
    const isPlayerValid =
      player && player.status === 'alive' && player.role === 'hunter';
    const isTargetValid =
      target && target.status === 'alive' && target.role !== 'hunter';

    if (!isNightPhase || !isPlayerValid || !isTargetValid) throw new Error();

    this.guardRequest = targetId;
  }

  decideGuardTarget(): string {
    const guardTargetId =
      this.guardRequest || this.playerManager.getRandomTarget('hunter');

    const { currentDay } = this.phaseManager;
    this.guardHistory[currentDay] = guardTargetId;
    this.guardRequest = null;

    return guardTargetId;
  }

  guard(attackTargetId: string): boolean {
    const guardTargetId = this.decideGuardTarget();
    return attackTargetId === guardTargetId;
  }

  getGuardHistory(userId: string): GuardHistory {
    this.playerManager.validatePlayerByRole(userId, 'hunter');
    return this.guardHistory;
  }
}
