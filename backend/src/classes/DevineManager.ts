import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { DevineResult } from '../config/types';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

export default class DevineManager {
  public devineRequest: string | null = null;
  public devineResult: DevineResult = {};
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveDevineRequest(playerId: string, targetId: string): void {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[playerId];
    const target = this.playerManager.players[targetId];

    const isNightPhase = currentPhase === 'night';
    const isPlayerValid =
      player && player.status === 'alive' && player.role === 'seer';
    const isTargetValid =
      target && target.status === 'alive' && target.role !== 'seer';

    if (!isNightPhase || !isPlayerValid || !isTargetValid)
      throw new AppError(400, errors.REQUEST_FAILED);

    this.devineRequest = targetId;
  }

  decideDevineTarget(): string | undefined {
    const devineTarget =
      this.devineRequest || this.playerManager.getRandomTarget('seer');
    this.devineRequest = null;
    if (!devineTarget) return;
    return devineTarget;
  }

  devine(): boolean {
    const seer = this.playerManager.getLivingPlayers('seer');
    if (seer.length === 0) {
      this.devineRequest = null;
      return false;
    }
    // 占いの対象を決める
    const devineTargetId = this.decideDevineTarget();
    if (!devineTargetId) return false;
    const devineTarget = this.playerManager.players[devineTargetId];

    // 占いの結果を記録する
    this.devineResult[this.phaseManager.currentDay] = {
      [devineTargetId]:
        devineTarget.role === 'werewolf' ? 'werewolves' : 'villagers',
    };

    return devineTarget.role === 'fox';
  }

  getDevineResult(userId: string): DevineResult {
    this.playerManager.validatePlayerByRole(userId, 'seer');
    return this.devineResult;
  }
}
