import { max, sample, countBy } from 'lodash';
import PlayerManager from './PlayerManager';
import PhaseManager from './PhaseManager';
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
  public players: PlayerManager;
  public phase: PhaseManager;
  public voteHistory: IVoteHistory = {};

  constructor(playerManager: PlayerManager, phaseManager: PhaseManager) {
    this.players = playerManager;
    this.phase = phaseManager;
  }

  receiveVote(voterId: string, voteeId: string) {
    const { currentPhase } = this.phase;
    const player = this.players.players[voterId];
    const target = this.players.players[voteeId];

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
    const { currentDay } = this.phase;

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
}
