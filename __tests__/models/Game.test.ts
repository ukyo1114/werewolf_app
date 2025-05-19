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
});
