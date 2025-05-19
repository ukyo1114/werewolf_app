import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import GameUser from '../../src/models/GameUser';

describe('GameUser Model Test', () => {
  const gameId1 = new ObjectId().toString();
  const gameId2 = new ObjectId().toString();
  const userId1 = new ObjectId().toString();
  const userId2 = new ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterEach(async () => {
    await GameUser.deleteMany({});
  });

  describe('GameUser Creation', () => {
    it('should create a new game user with default role', async () => {
      const gameUser = await GameUser.create({
        gameId: gameId1,
        userId: userId1,
      });

      expect(gameUser._id).toBeDefined();
      expect(gameUser.gameId.toString()).toEqual(gameId1.toString());
      expect(gameUser.userId.toString()).toEqual(userId1.toString());
      expect(gameUser.role).toBe('spectator');
      expect(gameUser.createdAt).toBeDefined();
      expect(gameUser.updatedAt).toBeDefined();
    });

    it('should create a new game user with specific role', async () => {
      const gameUser = await GameUser.create({
        gameId: gameId1,
        userId: userId1,
        role: 'villager',
      });

      expect(gameUser.role).toBe('villager');
    });

    it('should not create a game user without gameId', async () => {
      await expect(GameUser.create({ userId: userId1 })).rejects.toThrow();
    });

    it('should not create a game user without userId', async () => {
      await expect(GameUser.create({ gameId: gameId1 })).rejects.toThrow();
    });

    it('should not create a game user with invalid role', async () => {
      await expect(
        GameUser.create({
          gameId: gameId1,
          userId: userId1,
          role: 'invalid_role',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Unique Constraint', () => {
    it('should not create duplicate game user entries', async () => {
      await GameUser.create({ gameId: gameId1, userId: userId1 });
      await GameUser.createIndexes();

      await expect(
        GameUser.create({ gameId: gameId1, userId: userId1 }),
      ).rejects.toThrow();
    });

    it('should allow different users in the same game', async () => {
      await expect(
        GameUser.create({ gameId: gameId1, userId: userId1 }),
      ).resolves.toBeDefined();
      await expect(
        GameUser.create({ gameId: gameId1, userId: userId2 }),
      ).resolves.toBeDefined();
    });

    it('should allow same user in different games', async () => {
      await expect(
        GameUser.create({ gameId: gameId1, userId: userId1 }),
      ).resolves.toBeDefined();
      await expect(
        GameUser.create({ gameId: gameId2, userId: userId1 }),
      ).resolves.toBeDefined();
    });
  });

  describe('Role Validation', () => {
    const validRoles = [
      'villager',
      'seer',
      'medium',
      'hunter',
      'freemason',
      'werewolf',
      'madman',
      'fox',
      'immoralist',
      'spectator',
    ];

    it.each(validRoles)('should accept valid role: %s', async (role) => {
      const gameUser = await GameUser.create({
        gameId: gameId1,
        userId: userId1,
        role,
      });

      expect(gameUser.role).toBe(role);
    });
  });
});
