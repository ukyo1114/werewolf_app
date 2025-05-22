import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import { DevineResult } from '../config/types';

export default class DevineManager {
  public devineRequest: string | null = null;
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public devineResult: DevineResult = {};

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

    if (!isNightPhase || !isPlayerValid || !isTargetValid) throw new Error();

    this.devineRequest = targetId;
  }

  decideDevineTarget(): string {
    const devineTarget =
      this.devineRequest || this.playerManager.getRandomTarget('seer');
    this.devineRequest = null;
    return devineTarget;
  }

  devine(): boolean {
    // 占い師が死亡しているときは占いを行わない
    const seer = this.playerManager.getLivingPlayers('seer');
    if (seer.length === 0) {
      this.devineRequest = null;
      return false;
    }

    // 占いの対象を決める
    const devineTargetId = this.decideDevineTarget();
    const devineTarget = this.playerManager.players[devineTargetId];

    // 占いの結果を記録する
    this.devineResult[this.phaseManager.currentDay] = {
      [devineTargetId]:
        devineTarget.role === 'werewolf' ? 'werewolves' : 'villagers',
    };

    return devineTarget.role === 'fox';
  }

  getDevineResult(userId: string): DevineResult {
    const player = this.playerManager.players[userId];
    if (!player || player.role !== 'seer') throw new Error();

    return this.devineResult;
  }
}
