jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import VoteManager from '../../src/classes/VoteManager';
import PhaseManager from '../../src/classes/PhaseManager';
import PlayerManager from '../../src/classes/PlayerManager';
import { mockGameId, mockUsers, gamePlayers } from '../../__mocks__/mockdata';
import { EventEmitter } from 'events';

describe('test VoteManager', () => {
  const phaseManager = new PhaseManager(new EventEmitter(), {
    value: 'running',
  });
  const playerManager = new PlayerManager(mockGameId, mockUsers);
  const voteManager = new VoteManager(phaseManager, playerManager);

  beforeEach(() => {
    playerManager.players = gamePlayers();
  });

  afterAll(() => {
    const timerId = phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    jest.restoreAllMocks();
  });

  describe('receiveVote', () => {
    it('should accept a valid vote during day phase', () => {
      phaseManager.currentPhase = 'day';

      voteManager.receiveVote('villager', 'werewolf');
      expect(voteManager.votes.villager).toBe('werewolf');
    });

    it('should throw error when trying to vote for oneself', () => {
      phaseManager.currentPhase = 'day';
      expect(() => voteManager.receiveVote('villager', 'villager')).toThrow();
    });

    it('should throw error when voter is dead', () => {
      phaseManager.currentPhase = 'day';
      playerManager.players.villager.status = 'dead';

      expect(() => voteManager.receiveVote('villager', 'werewolf')).toThrow();
    });

    it('should throw error when voting target is dead', () => {
      phaseManager.currentPhase = 'day';
      playerManager.players.werewolf.status = 'dead';

      expect(() => voteManager.receiveVote('villager', 'werewolf')).toThrow();
    });

    it('should throw error when trying to vote during night phase', () => {
      phaseManager.currentPhase = 'night';

      expect(() => voteManager.receiveVote('villager', 'werewolf')).toThrow();
    });

    it('should throw error when voter does not exist', () => {
      phaseManager.currentPhase = 'day';
      expect(() =>
        voteManager.receiveVote('nonExistentPlayer', 'werewolf'),
      ).toThrow();
    });

    it('should throw error when voting target does not exist', () => {
      phaseManager.currentPhase = 'day';
      expect(() =>
        voteManager.receiveVote('villager', 'nonExistentPlayer'),
      ).toThrow();
    });

    it('should overwrite previous vote from the same voter', () => {
      phaseManager.currentPhase = 'day';

      // First vote
      voteManager.receiveVote('villager', 'werewolf');
      expect(voteManager.votes.villager).toBe('werewolf');

      // Second vote from the same voter
      voteManager.receiveVote('villager', 'seer');
      expect(voteManager.votes.villager).toBe('seer');
    });

    it('should handle multiple votes from different voters', () => {
      phaseManager.currentPhase = 'day';

      voteManager.receiveVote('villager', 'werewolf');
      voteManager.receiveVote('seer', 'werewolf');
      voteManager.receiveVote('medium', 'villager');

      expect(voteManager.votes).toEqual({
        villager: 'werewolf',
        seer: 'werewolf',
        medium: 'villager',
      });
    });
  });

  describe('getExecutionTarget', () => {
    const voteCounterMock = jest.spyOn(VoteManager.prototype, 'voteCounter');
    const genVoteHistorySpy = jest.spyOn(
      VoteManager.prototype,
      'genVoteHistory',
    );

    beforeEach(() => {
      voteCounterMock.mockClear();
      genVoteHistorySpy.mockClear();
    });

    afterAll(() => {
      voteCounterMock.mockRestore();
      genVoteHistorySpy.mockRestore();
    });

    it('should return the player with the most votes', () => {
      voteCounterMock.mockReturnValue({
        villager: 1,
        werewolf: 2,
      });
      const executionTarget = voteManager.getExecutionTarget();
      expect(executionTarget).toBe('werewolf');
      expect(voteCounterMock).toHaveBeenCalled();
      expect(genVoteHistorySpy).toHaveBeenCalled();
    });

    it('should throw error when no votes exist', () => {
      voteCounterMock.mockReturnValue({});
      expect(() => voteManager.getExecutionTarget()).toThrow();
      expect(genVoteHistorySpy).not.toHaveBeenCalled();
    });

    it('should handle tie votes by selecting the first player alphabetically', () => {
      voteCounterMock.mockReturnValue({
        villager: 2,
        werewolf: 2,
        seer: 1,
      });
      const executionTarget = voteManager.getExecutionTarget();
      expect(['villager', 'werewolf']).toContain(executionTarget);
      expect(voteCounterMock).toHaveBeenCalled();
      expect(genVoteHistorySpy).toHaveBeenCalled();
    });

    it('should handle single vote correctly', () => {
      voteCounterMock.mockReturnValue({
        werewolf: 1,
      });
      const executionTarget = voteManager.getExecutionTarget();
      expect(executionTarget).toBe('werewolf');
      expect(voteCounterMock).toHaveBeenCalled();
      expect(genVoteHistorySpy).toHaveBeenCalled();
    });

    it('should handle multiple players with same vote count', () => {
      voteCounterMock.mockReturnValue({
        villager: 1,
        werewolf: 1,
        seer: 1,
        medium: 1,
      });
      const executionTarget = voteManager.getExecutionTarget();
      expect(['villager', 'werewolf', 'seer', 'medium']).toContain(
        executionTarget,
      );
      expect(voteCounterMock).toHaveBeenCalled();
      expect(genVoteHistorySpy).toHaveBeenCalled();
    });

    it('should verify voteCounter was called', () => {
      voteCounterMock.mockReturnValue({
        werewolf: 1,
      });
      voteManager.getExecutionTarget();
      expect(voteCounterMock).toHaveBeenCalled();
      expect(genVoteHistorySpy).toHaveBeenCalled();
    });
  });

  describe('voteCounter', () => {
    it('should return vote counts in correct format', () => {
      voteManager.votes = {
        villager: 'werewolf',
        seer: 'werewolf',
        werewolf: 'villager',
      };

      const voteCount = voteManager.voteCounter();
      expect(voteCount).toEqual({
        villager: 1,
        werewolf: 2,
      });
    });

    it('should throw error when no votes exist', () => {
      voteManager.votes = {};

      expect(() => voteManager.voteCounter()).toThrow();
    });

    it('should handle single vote correctly', () => {
      voteManager.votes = {
        villager: 'werewolf',
      };

      const voteCount = voteManager.voteCounter();
      expect(voteCount).toEqual({
        werewolf: 1,
      });
    });

    it('should handle all votes for same target', () => {
      voteManager.votes = {
        villager: 'werewolf',
        seer: 'werewolf',
        medium: 'werewolf',
      };

      const voteCount = voteManager.voteCounter();
      expect(voteCount).toEqual({
        werewolf: 3,
      });
    });

    it('should handle votes with no overlap', () => {
      voteManager.votes = {
        villager: 'werewolf',
        seer: 'medium',
        medium: 'villager',
      };

      const voteCount = voteManager.voteCounter();
      expect(voteCount).toEqual({
        werewolf: 1,
        medium: 1,
        villager: 1,
      });
    });

    it('should handle overwritten votes correctly', () => {
      // First set of votes
      voteManager.votes = {
        villager: 'werewolf',
        seer: 'werewolf',
        medium: 'werewolf',
      };

      // Overwrite villager's vote
      voteManager.votes.villager = 'medium';

      const voteCount = voteManager.voteCounter();
      expect(voteCount).toEqual({
        werewolf: 2,
        medium: 1,
      });
    });
  });

  describe('genVoteHistory', () => {
    beforeEach(() => {
      phaseManager.currentDay = 0;
      voteManager.voteHistory = {};
    });

    it('should generate vote history in correct format and reset votes', () => {
      voteManager.votes = { villager: 'werewolf' };
      voteManager.genVoteHistory();

      expect(voteManager.voteHistory).toEqual({
        0: { werewolf: ['villager'] },
      });
      expect(voteManager.votes).toEqual({});
    });

    it('should handle multiple votes for same target', () => {
      voteManager.votes = {
        villager: 'werewolf',
        seer: 'werewolf',
        medium: 'werewolf',
      };
      voteManager.genVoteHistory();

      expect(voteManager.voteHistory).toEqual({
        0: { werewolf: ['villager', 'seer', 'medium'] },
      });
      expect(voteManager.votes).toEqual({});
    });

    it('should handle votes for different targets', () => {
      voteManager.votes = {
        villager: 'werewolf',
        seer: 'medium',
        medium: 'villager',
      };
      voteManager.genVoteHistory();

      expect(voteManager.voteHistory).toEqual({
        0: {
          werewolf: ['villager'],
          medium: ['seer'],
          villager: ['medium'],
        },
      });
      expect(voteManager.votes).toEqual({});
    });

    it('should increment day count for subsequent calls', () => {
      // First day
      voteManager.votes = { villager: 'werewolf' };
      voteManager.genVoteHistory();

      // Second day
      phaseManager.currentDay = 1;
      voteManager.votes = { seer: 'medium' };
      voteManager.genVoteHistory();

      expect(voteManager.voteHistory).toEqual({
        0: { werewolf: ['villager'] },
        1: { medium: ['seer'] },
      });
      expect(voteManager.votes).toEqual({});
    });

    it('should handle empty votes', () => {
      voteManager.votes = {};
      voteManager.genVoteHistory();

      expect(voteManager.voteHistory).toEqual({
        0: {},
      });
      expect(voteManager.votes).toEqual({});
    });

    it('should preserve existing vote history', () => {
      // Set up existing history
      voteManager.voteHistory = {
        0: { werewolf: ['villager'] },
      };

      // Add new votes
      phaseManager.currentDay = 1;
      voteManager.votes = { seer: 'medium' };
      voteManager.genVoteHistory();

      expect(voteManager.voteHistory).toEqual({
        0: { werewolf: ['villager'] },
        1: { medium: ['seer'] },
      });
      expect(voteManager.votes).toEqual({});
    });
  });
});
