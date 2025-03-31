import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

// Devine result structure: Day -> Target -> Result
interface IDevineResult {
  [key: string]: { [key: string]: 'villagers' | 'werewolves' };
}

export default class DevineManager {
  public devineRequest: string | null = null;
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public devineResult: IDevineResult = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveDevineRequest(playerId: string, targetId: string) {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[playerId];
    const target = this.playerManager.players[targetId];

    if (
      currentPhase !== 'night' ||
      player?.status !== 'alive' ||
      player.role !== 'seer' ||
      target?.status !== 'alive' ||
      target.role === 'seer'
    ) {
      throw new Error();
    }

    this.devineRequest = targetId;
  }

  devine(): string {
    const DevineTargetId: string =
      this.devineRequest || this.playerManager.getRandomTarget('seer');
    const devineTarget = this.playerManager.players[DevineTargetId];

    this.devineResult[this.phaseManager.currentDay] = {
      [DevineTargetId]:
        devineTarget.role !== 'werewolf' ? 'villagers' : 'werewolves',
    };

    this.devineRequest = null;

    // 狐の呪殺判定用にtargetId を返す
    return DevineTargetId;
  }

  getDevineResult(userId: string): IDevineResult {
    const player = this.playerManager.players[userId];
    if (!player || player.role !== 'seer') throw new Error();

    return this.devineResult;
  }
}
