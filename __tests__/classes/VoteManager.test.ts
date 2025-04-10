import { gameManagers } from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import { gamePlayers } from '../../__mocks__/mockdata';

beforeAll(() => {
  gameManagers[mockGameId] = new GameManager(
    mockChannelId,
    mockGameId,
    mockUsers,
  );
  gameManagers[mockGameId].sendMessage = jest.fn();
});

beforeEach(() => {
  const game = gameManagers[mockGameId];
  game.playerManager.players = structuredClone(gamePlayers);
});

afterAll(() => {
  const timerId = gameManagers[mockGameId].phaseManager.timerId;

  if (timerId) {
    clearTimeout(timerId);
  }

  delete gameManagers[mockGameId];
  jest.restoreAllMocks();
});

describe('test VoteManager', () => {
  describe('receiveVote', () => {
    it('投票が正常に受け付けされる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';

      game.voteManager.receiveVote('villager', 'werewolf');
      expect(game.voteManager.votes.villager).toBe('werewolf');
    });

    it('自分自身に投票しようとするとエラーが返る', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';

      expect(() =>
        game.voteManager.receiveVote('villager', 'villager'),
      ).toThrow();
    });

    it('投票者が死亡しているとエラーが返る', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.playerManager.players.villager.status = 'dead';

      expect(() =>
        game.voteManager.receiveVote('villager', 'werewolf'),
      ).toThrow();
    });

    it('投票対象が死亡しているとエラーが返る', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';
      game.playerManager.players.werewolf.status = 'dead';

      expect(() =>
        game.voteManager.receiveVote('villager', 'werewolf'),
      ).toThrow();
    });

    it('夜に投票しようとするとエラーが返る', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      expect(() =>
        game.voteManager.receiveVote('villager', 'werewolf'),
      ).toThrow();
    });
  });

  describe('getExcutionTarget', () => {
    it('最多得票者が処刑対象として返される', () => {
      const game = gameManagers[mockGameId];
      game.voteManager.votes = {
        villager: 'werewolf',
        seer: 'werewolf',
        werewolf: 'villager',
      };

      const executionTarget = game.voteManager.getExecutionTarget();
      expect(executionTarget).toBe('werewolf');
    });

    it('投票が無かった場合エラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.voteManager.votes = {};

      expect(() => game.voteManager.getExecutionTarget()).toThrow();
    });
  });

  describe('test voteCounter', () => {
    it('投票カウントが正しい形式で返されること', () => {
      const game = gameManagers[mockGameId];
      game.voteManager.votes = {
        villager: 'werewolf',
        seer: 'werewolf',
        werewolf: 'villager',
      };

      const voteCount = game.voteManager.voteCounter();
      expect(voteCount).toEqual({
        villager: 1,
        werewolf: 2,
      });
    });

    it('投票が存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.voteManager.votes = {};

      expect(() => game.voteManager.voteCounter()).toThrow();
    });
  });

  describe('test genVoteHistory', () => {
    it('投票履歴が正しい形式で生成され、投票がリセットされること', () => {
      const game = gameManagers[mockGameId];
      game.voteManager.votes = { villager: 'werewolf' };
      game.voteManager.genVoteHistory();

      expect(game.voteManager.voteHistory).toEqual({
        0: { werewolf: ['villager'] },
      });
      expect(game.voteManager.votes).toEqual({});
    });
  });
});
