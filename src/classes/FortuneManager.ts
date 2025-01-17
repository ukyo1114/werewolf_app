import { sample } from 'lodash';
import PlayerManager from './PlayerManager';
import PhaseManager from './PhaseManager';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

// Fortune result structure: Day -> Target -> Result
interface IFortuneResult {
  [key: string]: { [key: string]: string };
}

export default class FortuneManager {
  public fortuneRequest: string | null = null;
  public playerManager: PlayerManager;
  public phaseManager: PhaseManager;
  public fortuneResult: IFortuneResult = {};

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
      player.role !== 'seer' ||
      target?.status !== 'alive' ||
      target.role === 'seer'
    )
      throw new AppError(400, gameError.INVALID_FORTUNE);

    this.fortuneRequest = targetId;
  }

  fortune(): string | null {
    const { currentDay } = this.phaseManager;
    const seer = this.playerManager.findPlayerByRole('seer');

    if (seer?.status !== 'alive') return null;

    const targetId: string =
      this.fortuneRequest || this.getRandomFortuneTarget();
    const target = this.playerManager.players[targetId];

    this.fortuneResult[currentDay] = {
      [targetId]: target.role !== 'werewolf' ? 'villagers' : 'werewolves',
    };

    this.fortuneRequest = null;

    // 狐の呪殺判定用にtargetId を返す
    return targetId;
  }

  getRandomFortuneTarget(): string {
    const players = this.playerManager.players;
    const fortuneTargets = Object.values(players)
      .filter((user) => user.status === 'alive' && user.role !== 'seer')
      .map((user) => user.userId);

    return sample(fortuneTargets)!;
  }

  getFortuneResult(userId: string): IFortuneResult {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[userId];

    if (player?.role !== 'seer' || currentPhase === 'pre') {
      throw new AppError(403, gameError.FORTUNE_RESULT_NOT_FOUND);
    }

    return this.fortuneResult;
  }
}
