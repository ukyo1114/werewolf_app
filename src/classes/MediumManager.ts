import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

// Medium result structure: Day -> Target -> Result
interface IMediumResult {
  [key: string]: { [key: string]: 'villagers' | 'werewolves' };
}

export default class MediumManager {
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public mediumResult: IMediumResult = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  medium(targetId: string) {
    const { currentDay } = this.phaseManager;
    const target = this.playerManager.players[targetId];

    this.mediumResult[currentDay] = {
      [targetId]: target.role !== 'werewolf' ? 'villagers' : 'werewolves',
    };
  }

  getMediumResult(userId: string): IMediumResult {
    const player = this.playerManager.players[userId];
    if (!player || player.role !== 'medium') throw new Error();

    return this.mediumResult;
  }
}
