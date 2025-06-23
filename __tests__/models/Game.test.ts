import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import Game from '../../src/models/Game';

describe('Game Model Test', () => {
  const testChannelId = new ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterEach(async () => {
    await Game.deleteMany({});
  });

  describe('Game Creation', () => {
    it('should create a new game with default values', async () => {
      const game = await Game.create({ channelId: testChannelId });

      expect(game._id).toBeDefined();
      expect(game.channelId.toString()).toEqual(testChannelId);
      expect(game.result).toBe('running');
      expect(game.numberOfPlayers).toBe(10);
      expect(game.createdAt).toBeDefined();
      expect(game.updatedAt).toBeDefined();
    });

    it('should not create a game with invalid number of players', async () => {
      await expect(
        Game.create({ channelId: testChannelId, numberOfPlayers: 4 }),
      ).rejects.toThrow();
    });

    it('should not create a game with too many players', async () => {
      await expect(
        Game.create({ channelId: testChannelId, numberOfPlayers: 21 }),
      ).rejects.toThrow();
    });
  });

  describe('End Game', () => {
    it('should end game with villagers win result', async () => {
      const game = await Game.create({ channelId: testChannelId });

      await Game.endGame(game._id.toString(), 'villagersWin');

      const updatedGame = await Game.findById(game._id);
      expect(updatedGame?.result).toBe('villagersWin');
    });

    it('should end game with werewolves win result', async () => {
      const game = await Game.create({ channelId: testChannelId });

      await Game.endGame(game._id.toString(), 'werewolvesWin');

      const updatedGame = await Game.findById(game._id);
      expect(updatedGame?.result).toBe('werewolvesWin');
    });

    it('should end game with foxes win result', async () => {
      const game = await Game.create({ channelId: testChannelId });

      await Game.endGame(game._id.toString(), 'foxesWin');

      const updatedGame = await Game.findById(game._id);
      expect(updatedGame?.result).toBe('foxesWin');
    });

    it('should end game with village abandoned result', async () => {
      const game = await Game.create({ channelId: testChannelId });

      await Game.endGame(game._id.toString(), 'villageAbandoned');

      const updatedGame = await Game.findById(game._id);
      expect(updatedGame?.result).toBe('villageAbandoned');
    });

    it('should not change result when ending game with running status', async () => {
      const game = await Game.create({ channelId: testChannelId });

      await Game.endGame(game._id.toString(), 'running');

      const updatedGame = await Game.findById(game._id);
      expect(updatedGame?.result).toBe('running');
    });

    it('should handle non-existent game id gracefully', async () => {
      const nonExistentGameId = new ObjectId().toString();

      await expect(
        Game.endGame(nonExistentGameId, 'villagersWin'),
      ).resolves.toBeUndefined();
    });

    it('should not throw error when database operation fails', async () => {
      const game = await Game.create({ channelId: testChannelId });

      // 無効なObjectIdを渡してエラーを発生させる
      const invalidGameId = 'invalid-game-id';

      await expect(
        Game.endGame(invalidGameId, 'villagersWin'),
      ).resolves.toBeUndefined();
    });

    it('should handle null game id gracefully', async () => {
      await expect(
        Game.endGame(null as any, 'villagersWin'),
      ).resolves.toBeUndefined();
    });
  });
});
