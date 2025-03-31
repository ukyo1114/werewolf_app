import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

// Guard history structure: Day -> Target
interface IGuardHistory {
  [key: string]: string;
}

export default class GuardManager {
  public guardRequest: string | null = null;
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public guardHistory: IGuardHistory = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveGuradRequest(playerId: string, targetId: string) {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[playerId];
    const target = this.playerManager.players[targetId];

    if (
      currentPhase !== 'night' ||
      player?.status !== 'alive' ||
      player.role !== 'hunter' ||
      target?.status !== 'alive' ||
      target.role === 'hunter'
    ) {
      throw new Error();
    }

    this.guardRequest = targetId;
  }

  guard(attackTargetId: string): boolean {
    const { currentDay } = this.phaseManager;

    const guardTargetId =
      this.guardRequest || this.playerManager.getRandomTarget('hunter');
    this.guardHistory[currentDay] = guardTargetId;

    this.guardRequest = null;

    return attackTargetId === guardTargetId;
  }

  getGuardHistory(userId: string): IGuardHistory {
    const player = this.playerManager.players[userId];
    if (!player || player.role !== 'hunter') throw new Error();

    return this.guardHistory;
  }
}
