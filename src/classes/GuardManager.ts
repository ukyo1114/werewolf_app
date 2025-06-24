import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { GuardHistory } from '../config/types';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

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

    if (!isNightPhase || !isPlayerValid || !isTargetValid)
      throw new AppError(400, errors.REQUEST_FAILED);

    this.guardRequest = targetId;
  }

  decideGuardTarget(): string | undefined {
    const guardTargetId =
      this.guardRequest || this.playerManager.getRandomTarget('hunter');
    this.guardRequest = null;
    if (!guardTargetId) return;

    const { currentDay } = this.phaseManager;
    this.guardHistory[currentDay] = guardTargetId;

    return guardTargetId;
  }

  guard(): string | undefined {
    const hunter = this.playerManager.getLivingPlayers('hunter');
    if (hunter.length === 0) return;

    return this.decideGuardTarget();
  }

  getGuardHistory(userId: string): GuardHistory {
    this.playerManager.validatePlayerByRole(userId, 'hunter');
    return this.guardHistory;
  }
}
