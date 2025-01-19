import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

// Medium result structure: Day -> Target -> Result
interface IMediumResult {
  [key: string]: { [key: string]: string };
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
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[userId];

    if (player?.role !== 'medium' || currentPhase === 'pre') {
      throw new AppError(403, gameError.MEDIUM_RESULT_NOT_FOUND);
    }

    return this.mediumResult;
  }
}
