import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';

type Team = 'villagers' | 'werewolves';
type MediumResult = Record<string, Record<string, Team>>;

export default class MediumManager {
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public mediumResult: MediumResult = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  medium(targetId: string): void {
    const { currentDay } = this.phaseManager;
    const target = this.playerManager.players[targetId];

    this.mediumResult[currentDay] = {
      [targetId]: target.role !== 'werewolf' ? 'villagers' : 'werewolves',
    };
  }

  getMediumResult(userId: string): MediumResult {
    const player = this.playerManager.players[userId];
    if (!player || player.role !== 'medium') throw new Error();

    return this.mediumResult;
  }
}
