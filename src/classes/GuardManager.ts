import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import { GuardHistory } from '../config/types';

export default class GuardManager {
  public guardRequest: string | null = null;
  public guardHistory: GuardHistory = {};
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;

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

  decideGuardTarget(): string | undefined {
    const guardTargetId =
      this.guardRequest || this.playerManager.getRandomTarget('hunter');
    if (!guardTargetId) return;

    const { currentDay } = this.phaseManager;
    this.guardHistory[currentDay] = guardTargetId;
    this.guardRequest = null;

    return guardTargetId;
  }

  guard(): string | undefined {
    const hunter = this.playerManager.getLivingPlayers('hunter');
    if (hunter.length === 0) {
      this.guardRequest = null;
      return;
    }

    return this.decideGuardTarget();
  }

  getGuardHistory(userId: string): GuardHistory {
    this.playerManager.validatePlayerByRole(userId, 'hunter');
    return this.guardHistory;
  }
}
