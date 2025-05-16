import mongoose from 'mongoose';
import Game from '../../src/models/Game';
import { Types } from 'mongoose';

describe('Game Model Test', () => {
  beforeEach(async () => {
    // 各テスト前にコレクションをクリア
    await Game.deleteMany({});
  });

  describe('Game Creation', () => {
    it('should create a new game with default values', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId });
      const savedGame = await game.save();

      expect(savedGame._id).toBeDefined();
      expect(savedGame.channelId).toEqual(channelId);
      expect(savedGame.result).toBe('running');
      expect(savedGame.numberOfPlayers).toBe(10);
      expect(savedGame.createdAt).toBeDefined();
      expect(savedGame.updatedAt).toBeDefined();
    });

    it('should not create a game with invalid number of players', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId, numberOfPlayers: 4 }); // min is 5

      await expect(game.save()).rejects.toThrow();
    });

    it('should not create a game with too many players', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId, numberOfPlayers: 21 }); // max is 20

      await expect(game.save()).rejects.toThrow();
    });
  });

  describe('getRunningGame', () => {
    it('should find a running game for a channel', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId });
      await game.save();

      const foundGame = await Game.getRunningGame(channelId);
      expect(foundGame).toBeDefined();
      expect(foundGame?.channelId).toEqual(channelId);
      expect(foundGame?.result).toBe('running');
    });

    it('should return null when no running game exists', async () => {
      const channelId = new Types.ObjectId();
      const foundGame = await Game.getRunningGame(channelId);
      expect(foundGame).toBeNull();
    });

    it('should not find a game with different channelId', async () => {
      const channelId1 = new Types.ObjectId();
      const channelId2 = new Types.ObjectId();
      const game = new Game({ channelId: channelId1 });
      await game.save();

      const foundGame = await Game.getRunningGame(channelId2);
      expect(foundGame).toBeNull();
    });
  });

  describe('endGame', () => {
    it('should end a game with villagersWin result', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId });
      await game.save();

      const endedGame = await game.endGame('villagersWin');
      expect(endedGame.result).toBe('villagersWin');
    });

    it('should end a game with werewolvesWin result', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId });
      await game.save();

      const endedGame = await game.endGame('werewolvesWin');
      expect(endedGame.result).toBe('werewolvesWin');
    });

    it('should end a game with foxesWin result', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId });
      await game.save();

      const endedGame = await game.endGame('foxesWin');
      expect(endedGame.result).toBe('foxesWin');
    });

    it('should end a game with villageAbandoned result', async () => {
      const channelId = new Types.ObjectId();
      const game = new Game({ channelId });
      await game.save();

      const endedGame = await game.endGame('villageAbandoned');
      expect(endedGame.result).toBe('villageAbandoned');
    });
  });
});
