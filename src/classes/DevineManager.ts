import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

type Team = 'villagers' | 'werewolves';
type DevineResult = Record<number, Record<string, Team>>;

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

  devine(): string {
    const devineTargetId = this.decideDevineTarget();
    const devineTarget = this.playerManager.players[devineTargetId];

    this.devineResult[this.phaseManager.currentDay] = {
      [devineTargetId]:
        devineTarget.role === 'werewolf' ? 'werewolves' : 'villagers',
    };

    return devineTargetId;
  }

  getDevineResult(userId: string): DevineResult {
    const player = this.playerManager.players[userId];
    if (!player || player.role !== 'seer') throw new Error();

    return this.devineResult;
  }
}
