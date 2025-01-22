import { sample } from 'lodash';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import GuardManager from './GuardManager';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

// Attack history structure: Day -> Target
interface IAttackHistory {
  [key: string]: string;
}

export default class AttackManager {
  public attackRequest: string | null = null;
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public guardManager: GuardManager;
  public attackHistory: IAttackHistory = {};

  constructor(
    phaseManager: PhaseManager,
    playerManager: PlayerManager,
    guardManager: GuardManager,
  ) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
    this.guardManager = guardManager;
  }

  receiveAttackRequest(playerId: string, targetId: string) {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[playerId];
    const target = this.playerManager.players[targetId];

    if (
      currentPhase !== 'night' ||
      player?.status !== 'alive' ||
      player.role !== 'werewolf' ||
      target?.status !== 'alive' ||
      target.role === 'werewolf'
    )
      throw new AppError(400, gameError.INVALID_ATTACK);

    this.attackRequest = targetId;
  }

  attack(): string | null {
    const { currentDay } = this.phaseManager;
    const attackTargetId = this.attackRequest || this.getRandomAttackTarget();

    this.attackHistory[currentDay] = attackTargetId;
    this.attackRequest = null;

    const attackTarget = this.playerManager.players[attackTargetId];
    if (attackTarget.role === 'fox') return null;

    const hunter = this.playerManager.findPlayerByRole('hunter');
    if (hunter?.status === 'alive') {
      const guardResult = this.guardManager.guard(attackTargetId);
      if (guardResult) return null;
    }

    this.playerManager.kill(attackTargetId);

    return attackTargetId;
  }

  getRandomAttackTarget(): string {
    const players = this.playerManager.players;
    const attackTargets = Object.values(players)
      .filter((user) => user.status === 'alive' && user.role !== 'werewolf')
      .map((user) => user.userId);

    return sample(attackTargets)!;
  }

  getAttackHistory(userId: string): IAttackHistory {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[userId];

    if (player?.role !== 'werewolf' || currentPhase === 'pre') {
      throw new AppError(403, gameError.ATTACK_HISTORY_NOT_FOUND);
    }

    return this.attackHistory;
  }
}
