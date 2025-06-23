import _ from 'lodash';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import { VotesByVotee, VoteHistory } from '../config/types';

export default class VoteManager {
  public votes: Record<string, string> = {};
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public voteHistory: VoteHistory = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveVote(voterId: string, voteeId: string): void {
    if (voterId === voteeId) throw new Error();

    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[voterId];
    const target = this.playerManager.players[voteeId];

    const isDayPhase = currentPhase === 'day';
    const isPlayerValid = player && player.status === 'alive';
    const isTargetValid = target && target.status === 'alive';

    if (!isDayPhase || !isPlayerValid || !isTargetValid) throw new Error();

    this.votes[voterId] = voteeId;
  }

  getExecutionTarget(): string | undefined {
    const voteCount = this.voteCounter();

    // 最多得票者の配列を作成
    const maxVotes = _.max(Object.values(voteCount));
    const executionTargets = Object.entries(voteCount)
      .filter(([_, count]) => count === maxVotes)
      .map(([votee]) => votee);

    const target = _.sample(executionTargets);
    if (!target) return;

    this.genVoteHistory();

    return target;
  }

  voteCounter(): Record<string, number> {
    const votes = this.votes;
    if (Object.keys(votes).length === 0) throw new Error();

    const voteeArray = Object.values(votes);
    return _.countBy(voteeArray);
  }

  genVoteHistory(): void {
    const { currentDay } = this.phaseManager;
    const votesByVotee: VotesByVotee = {};
    // 投票を得票者 -> 投票者リストに変換
    for (const [voter, votee] of Object.entries(this.votes)) {
      if (!votesByVotee[votee]) {
        votesByVotee[votee] = [];
      }
      votesByVotee[votee].push(voter);
    }
    this.voteHistory[currentDay] = votesByVotee;
    // 投票をリセット
    this.votes = {};
  }
}
