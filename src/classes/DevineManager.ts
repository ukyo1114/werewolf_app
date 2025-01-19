import { sample } from 'lodash';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

// Devine result structure: Day -> Target -> Result
interface IDevineResult {
  [key: string]: { [key: string]: string };
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
    )
      throw new AppError(400, gameError.INVALID_FORTUNE);

    this.devineRequest = targetId;
  }

  devine(): string {
    const { currentDay } = this.phaseManager;

    const DevineTargetId: string =
      this.devineRequest || this.getRandomDevineTarget();
    const devineTarget = this.playerManager.players[DevineTargetId];

    this.devineResult[currentDay] = {
      [DevineTargetId]:
        devineTarget.role !== 'werewolf' ? 'villagers' : 'werewolves',
    };

    this.devineRequest = null;

    // 狐の呪殺判定用にtargetId を返す
    return DevineTargetId;
  }

  getRandomDevineTarget(): string {
    const players = this.playerManager.players;
    const devineTargets = Object.values(players)
      .filter((user) => user.status === 'alive' && user.role !== 'seer')
      .map((user) => user.userId);

    return sample(devineTargets)!;
  }

  getDevineResult(userId: string): IDevineResult {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[userId];

    if (player?.role !== 'seer' || currentPhase === 'pre') {
      throw new AppError(403, gameError.FORTUNE_RESULT_NOT_FOUND);
    }

    return this.devineResult;
  }
}
