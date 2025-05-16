import mongoose from 'mongoose';
import GameUser from '../../src/models/GameUser';
import { Types } from 'mongoose';

describe('GameUser Model Test', () => {
  beforeEach(async () => {
    // 各テスト前にコレクションをクリア
    await GameUser.deleteMany({});
  });

  describe('GameUser Creation', () => {
    it('should create a new game user with default role', async () => {
      const gameId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const gameUser = new GameUser({ gameId, userId });
      const savedGameUser = await gameUser.save();

      expect(savedGameUser._id).toBeDefined();
      expect(savedGameUser.gameId).toEqual(gameId);
      expect(savedGameUser.userId).toEqual(userId);
      expect(savedGameUser.role).toBe('spectator');
      expect(savedGameUser.createdAt).toBeDefined();
      expect(savedGameUser.updatedAt).toBeDefined();
    });

    it('should create a new game user with specific role', async () => {
      const gameId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const gameUser = new GameUser({ gameId, userId, role: 'villager' });
      const savedGameUser = await gameUser.save();

      expect(savedGameUser.role).toBe('villager');
    });

    it('should not create a game user without gameId', async () => {
      const userId = new Types.ObjectId();
      const gameUser = new GameUser({ userId });

      await expect(gameUser.save()).rejects.toThrow();
    });

    it('should not create a game user without userId', async () => {
      const gameId = new Types.ObjectId();
      const gameUser = new GameUser({ gameId });

      await expect(gameUser.save()).rejects.toThrow();
    });

    it('should not create a game user with invalid role', async () => {
      const gameId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const gameUser = new GameUser({ gameId, userId, role: 'invalid_role' });

      await expect(gameUser.save()).rejects.toThrow();
    });
  });

  describe('Unique Constraint', () => {
    it('should not create duplicate game user entries', async () => {
      const gameId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      // 最初のゲームユーザーを作成
      const gameUser1 = new GameUser({ gameId, userId });
      await gameUser1.save();

      // 同じgameIdとuserIdの組み合わせで2つ目のゲームユーザーを作成
      const gameUser2 = new GameUser({ gameId, userId });
      await expect(gameUser2.save()).rejects.toThrow();
    });

    it('should allow different users in the same game', async () => {
      const gameId = new Types.ObjectId();
      const userId1 = new Types.ObjectId();
      const userId2 = new Types.ObjectId();

      const gameUser1 = new GameUser({ gameId, userId: userId1 });
      const gameUser2 = new GameUser({ gameId, userId: userId2 });

      await expect(gameUser1.save()).resolves.toBeDefined();
      await expect(gameUser2.save()).resolves.toBeDefined();
    });

    it('should allow same user in different games', async () => {
      const gameId1 = new Types.ObjectId();
      const gameId2 = new Types.ObjectId();
      const userId = new Types.ObjectId();

      const gameUser1 = new GameUser({ gameId: gameId1, userId });
      const gameUser2 = new GameUser({ gameId: gameId2, userId });

      await expect(gameUser1.save()).resolves.toBeDefined();
      await expect(gameUser2.save()).resolves.toBeDefined();
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
      const gameId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const gameUser = new GameUser({ gameId, userId, role });
      const savedGameUser = await gameUser.save();

      expect(savedGameUser.role).toBe(role);
    });
  });
});
