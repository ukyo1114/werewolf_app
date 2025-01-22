import { max, sample, countBy } from 'lodash';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import AppError from '../utils/AppError';
import { gameError } from '../config/messages';

// Vote history structure: Day -> Votee -> Voters
interface IVotesByVotee {
  [key: string]: string[];
}
interface IVoteHistory {
  [key: string]: IVotesByVotee;
}

export default class VoteManager {
  public votes: { [key: string]: string } = {};
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public voteHistory: IVoteHistory = {};

  constructor(phaseManager: PhaseManager, playerManager: PlayerManager) {
    this.phaseManager = phaseManager;
    this.playerManager = playerManager;
  }

  receiveVote(voterId: string, voteeId: string) {
    const { currentPhase } = this.phaseManager;
    const player = this.playerManager.players[voterId];
    const target = this.playerManager.players[voteeId];

    if (
      player?.status !== 'alive' ||
      target?.status !== 'alive' ||
      currentPhase !== 'day'
    ) {
      throw new AppError(400, gameError.INVALID_VOTE);
    }

    this.votes[voterId] = voteeId;
  }

  getExecutionTarget(): string | null {
    const voteCount = this.voteCounter();
    if (Object.keys(voteCount).length === 0) return null;

    // 最多得票者の配列を作成
    const maxVotes = max(Object.values(voteCount));
    const executionTargets = Object.entries(voteCount)
      .filter(([_, count]) => count === maxVotes)
      .map(([votee]) => votee);

    this.genVoteHistory();

    // 配列からランダムに選んだプレイヤーを返す
    return sample(executionTargets)!;
  }

  voteCounter(): { [key: string]: number } {
    const votes = this.votes;
    if (!votes) return {};

    const voteeArray = Object.values(votes);
    return countBy(voteeArray);
  }

  genVoteHistory() {
    const { currentDay } = this.phaseManager;

    const votesByVotee: IVotesByVotee = {};

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

  getVoteHistory(): IVoteHistory {
    const { currentPhase } = this.phaseManager;

    if (currentPhase === 'pre') {
      throw new AppError(403, gameError.VOTE_HISTORY_NOT_FOUND);
    }

    return this.voteHistory;
  }
}
