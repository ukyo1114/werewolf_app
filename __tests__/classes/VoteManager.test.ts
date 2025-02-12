import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';

beforeEach(() => {
  games[mockGameId] = new GameManager(mockChannelId, mockGameId, mockUsers);
  // sendMessageをモック
  games[mockGameId].sendMessage = jest.fn();
});

afterEach(() => {
  const timerId = games[mockGameId].phaseManager.timerId;

  if (timerId) {
    clearTimeout(timerId);
  }
});

afterAll(() => {
  delete games[mockGameId];
  jest.restoreAllMocks();
});

describe('test VoteManager', () => {
  describe('receiveVote', () => {
    it('投票が正常に受け付けされる', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const voter = mockUsers[1].userId;
      const votee = mockUsers[2].userId;

      game.voteManager.receiveVote(voter, votee);

      expect(game.phaseManager.currentPhase).toBe('day');
      expect(game.voteManager.votes[voter]).toBe(votee);
    });

    it('投票者が死亡しているとエラーが返る', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const voter = mockUsers[1].userId;
      const votee = mockUsers[2].userId;

      game.playerManager.kill(voter);

      expect(() => game.voteManager.receiveVote(voter, votee)).toThrow(
        new AppError(400, gameError.INVALID_VOTE),
      );
    });

    it('投票対象が死亡しているとエラーが返る', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const voter = mockUsers[1].userId;
      const votee = mockUsers[2].userId;

      game.playerManager.kill(votee);

      expect(() => game.voteManager.receiveVote(voter, votee)).toThrow(
        new AppError(400, gameError.INVALID_VOTE),
      );
    });

    it('夜に投票しようとするとエラーが返る', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();
      game.phaseManager.nextPhase();

      const voter = mockUsers[1].userId;
      const votee = mockUsers[2].userId;

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() => game.voteManager.receiveVote(voter, votee)).toThrow(
        new AppError(400, gameError.INVALID_VOTE),
      );
    });
  });

  describe('getExcutionTarget', () => {
    it('最多得票者が処刑対象として返される', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const [
        user1,
        user2,
        user3,
        user4,
        user5,
        user6,
        user7,
        user8,
        user9,
        user10,
      ] = mockUsers.map((user) => user.userId);

      game.voteManager.receiveVote(user1, user2);
      game.voteManager.receiveVote(user2, user1);
      game.voteManager.receiveVote(user3, user2);
      game.voteManager.receiveVote(user4, user2);
      game.voteManager.receiveVote(user5, user2);
      game.voteManager.receiveVote(user6, user1);
      game.voteManager.receiveVote(user7, user1);
      game.voteManager.receiveVote(user8, user1);
      game.voteManager.receiveVote(user9, user1);
      game.voteManager.receiveVote(user10, user1);

      const executionTarget = game.voteManager.getExecutionTarget();

      expect(executionTarget).toBe(user1);
    });

    it('投票が無かった場合、nullが返される', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const executionTarget = game.voteManager.getExecutionTarget();

      expect(executionTarget).toBeNull();
    });
  });

  describe('test voteCounter', () => {
    it('投票カウントが正しい形式で返されること', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const voter = mockUsers[1].userId;
      const votee = mockUsers[2].userId;

      game.voteManager.receiveVote(voter, votee);

      const voteCount = game.voteManager.voteCounter();

      expect(voteCount).toEqual({
        [votee]: 1,
      });
    });
  });

  describe('test genVoteHistory', () => {
    it('投票履歴が正しい形式で生成され、投票がリセットされること', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const voter = mockUsers[1].userId;
      const votee = mockUsers[2].userId;

      game.voteManager.receiveVote(voter, votee);
      game.voteManager.genVoteHistory();

      expect(game.voteManager.voteHistory).toEqual({
        1: {
          [votee]: [voter],
        },
      });
      expect(game.voteManager.votes).toEqual({});
    });
  });

  describe('test getVoteHistory', () => {
    it('投票履歴が正しい形式で返されること', () => {
      const game = games[mockGameId];

      game.phaseManager.nextPhase();

      const voter = mockUsers[1].userId;
      const votee = mockUsers[2].userId;

      game.voteManager.receiveVote(voter, votee);
      game.voteManager.genVoteHistory();
      const voteHistory = game.voteManager.getVoteHistory();

      expect(voteHistory).toEqual({
        1: {
          [votee]: [voter],
        },
      });
    });

    it('preフェーズに投票履歴を取得しようとするとエラーが返されること', () => {
      const game = games[mockGameId];
      expect(() => game.voteManager.getVoteHistory()).toThrow(
        new AppError(403, gameError.VOTE_HISTORY_NOT_FOUND),
      );
    });
  });
});
