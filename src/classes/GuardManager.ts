import { sample } from 'lodash';
import PlayerManager from './PlayerManager';
import PhaseManager from './PhaseManager';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

// Fortune result structure: Day -> Target
interface IGuardHistory {
  [key: string]: string;
}

export default class GuardManager {
  public guardRequest: string | null = null;
  public playerManager: PlayerManager;
  public phaseManager: PhaseManager;
  public guardHistory: IGuardHistory = {};

  constructor(playerManager: PlayerManager, phaseManager: PhaseManager) {
    this.playerManager = playerManager;
    this.phaseManager = phaseManager;
  }

  receiveFortuneRequest(playerId: string, targetId: string) {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[playerId];
    const target = this.playerManager.players[targetId];

    if (
      currentPhase !== 'night' ||
      player?.status !== 'alive' ||
      player.role !== 'hunter' ||
      target?.status !== 'alive' ||
      target.role === 'hunter'
    )
      throw new AppError(400, gameError.INVALID_GUARD);

    this.guardRequest = targetId;
  }

  guard(attackTargetId: string): boolean {
    const { currentDay } = this.phaseManager;
    const hunter = this.playerManager.findPlayerByRole('hunter');

    if (hunter?.status !== 'alive') return false;

    const guardTargetId = this.guardRequest || this.getRandomGuardTarget();
    this.guardHistory[currentDay] = guardTargetId;

    this.guardRequest = null;

    return attackTargetId === guardTargetId;
  }

  getRandomGuardTarget(): string {
    const players = this.playerManager.players;
    const guardTargets = Object.values(players)
      .filter((user) => user.status === 'alive' && user.role !== 'hunter')
      .map((user) => user.userId);

    return sample(guardTargets)!;
  }

  getGuardHistory(userId: string): IGuardHistory {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[userId];

    if (player?.role !== 'hunter' || currentPhase === 'pre') {
      throw new AppError(403, gameError.FORTUNE_RESULT_NOT_FOUND);
    }

    return this.guardHistory;
  }
}
