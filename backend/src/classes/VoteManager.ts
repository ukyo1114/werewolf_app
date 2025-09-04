import _ from 'lodash';

import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import { VoteHistory } from '../config/types';

export default class VoteManager {
  protected votes: Record<string, string> = {};
  protected phaseManager: PhaseManager;
  protected playerManager: PlayerManager;
  public voteHistory: VoteHistory = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveVote(voterId: string, voteeId: string): void {
    this.validateVote(voterId, voteeId);
    this.votes[voterId] = voteeId;
  }

  protected validateDayPhase(): void {
    if (this.phaseManager.currentPhase !== 'day') {
      throw new AppError(400, errors.VOTE_FAILED);
    }
  }

  protected validatePlayer(playerId: string): void {
    const player = this.playerManager.players[playerId];
    if (!player || player.status !== 'alive') {
      throw new AppError(400, errors.VOTE_FAILED);
    }
  }

  protected validateVote(voterId: string, voteeId: string): void {
    if (voterId === voteeId) throw new AppError(400, errors.VOTE_FAILED);
    this.validateDayPhase();
    this.validatePlayer(voterId);
    this.validatePlayer(voteeId);
  }

  getExecutionTarget(): string | undefined {
    const target = this.decideExecutionTarget();
    this.logVoteHistory();
    return target;
  }

  protected voteCounter(): Record<string, number> | undefined {
    const votes = this.votes;
    if (Object.keys(votes).length === 0) return;

    const voteeArray = Object.values(votes);
    return _.countBy(voteeArray);
  }

  protected decideExecutionTarget(): string | undefined {
    const voteCount = this.voteCounter();
    if (!voteCount) return;

    const maxVotes = _.max(Object.values(voteCount));
    const targets = Object.entries(voteCount)
      .filter(([_, count]) => count === maxVotes)
      .map(([votee]) => votee);

    return _.sample(targets);
  }

  protected logVoteHistory(): void {
    const { currentDay } = this.phaseManager;
    const votesByVotee = this.genVoteHistory();
    this.voteHistory[currentDay] = votesByVotee;
    this.votes = {};
  }

  protected genVoteHistory(): Record<string, string[]> {
    const votesByVotee: any = {};

    for (const [voter, votee] of Object.entries(this.votes)) {
      if (!votesByVotee[votee]) {
        votesByVotee[votee] = [];
      }
      votesByVotee[votee].push(voter);
    }

    return votesByVotee;
  }
}
