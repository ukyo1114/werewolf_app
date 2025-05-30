import User from '../../src/models/User';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';

describe('User Model Test', () => {
  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a new user with default values', async () => {
      const user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.userName).toBe('testUser');
      expect(user.email).toBe('test@example.com');
      expect(user.isGuest).toBe(false);
      expect(user.GameStats.totalGames).toBe(0);
      expect(user.GameStats.victories).toBe(0);
      expect(user.GameStats.roleStats).toBeDefined();
    });

    it('should create a guest user', async () => {
      const user = await User.create({
        isGuest: true,
      });

      expect(user.userName).toBe('ゲスト');
      expect(user.isGuest).toBe(true);
      expect(user.email).toBeUndefined();
      expect(user.password).toBeNull();
    });

    it('testのためのテスト', async () => {
      await Promise.all([
        User.create({
          isGuest: true,
        }),
        User.create({
          isGuest: true,
        }),
      ]);

      const users = await User.find({ isGuest: true });
      expect(users.length).toBe(2);
    });

    it('should create 2 guest users', async () => {
      for (let i = 0; i < 2; i++) {
        await User.create({ isGuest: true });

        await User.createIndexes();
      }

      const users = await User.find({ isGuest: true });
      expect(users.length).toBe(2);
    });

    it('should hash password for non-guest users', async () => {
      const user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.password).not.toBe('password123');
      expect(await user.matchPassword('password123')).toBe(true);
      expect(await user.matchPassword('wrongpassword')).toBe(false);
    });
  });

  describe('Game Stats', () => {
    let user: any;

    beforeEach(async () => {
      user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should update game stats for a victory', async () => {
      await user.updateGameStats('werewolf', true);

      expect(user.GameStats.totalGames).toBe(1);
      expect(user.GameStats.victories).toBe(1);
      expect(user.GameStats.roleStats.werewolf.totalGames).toBe(1);
      expect(user.GameStats.roleStats.werewolf.victories).toBe(1);
    });

    it('should update game stats for a defeat', async () => {
      await user.updateGameStats('villager', false);

      expect(user.GameStats.totalGames).toBe(1);
      expect(user.GameStats.victories).toBe(0);
      expect(user.GameStats.roleStats.villager.totalGames).toBe(1);
      expect(user.GameStats.roleStats.villager.victories).toBe(0);
    });

    it('should accumulate game stats correctly', async () => {
      // Win as werewolf
      await user.updateGameStats('werewolf', true);
      // Lose as villager
      await user.updateGameStats('villager', false);
      // Win as seer
      await user.updateGameStats('seer', true);

      expect(user.GameStats.totalGames).toBe(3);
      expect(user.GameStats.victories).toBe(2);
      expect(user.GameStats.roleStats.werewolf.totalGames).toBe(1);
      expect(user.GameStats.roleStats.werewolf.victories).toBe(1);
      expect(user.GameStats.roleStats.villager.totalGames).toBe(1);
      expect(user.GameStats.roleStats.villager.victories).toBe(0);
      expect(user.GameStats.roleStats.seer.totalGames).toBe(1);
      expect(user.GameStats.roleStats.seer.victories).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should not create user with invalid email', async () => {
      await expect(
        User.create({
          userName: 'testUser',
          email: 'invalid-email',
          password: 'password123',
        }),
      ).rejects.toThrow();
    });

    it('should not create user with password shorter than 8 characters', async () => {
      await expect(
        User.create({
          userName: 'testUser',
          email: 'test@example.com',
          password: 'a'.repeat(7),
        }),
      ).rejects.toThrow();
    });

    it('should not create user with userName longer than 20 characters', async () => {
      await expect(
        User.create({
          userName: 'a'.repeat(21),
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password when creating new user', async () => {
      const password = 'password123';
      const user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password,
      });

      expect(user.password).not.toBe(password);
      expect(await user.matchPassword(password)).toBe(true);
    });

    it('should hash password when updating password', async () => {
      const user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'oldpassword',
      });

      const oldHashedPassword = user.password;
      user.password = 'newpassword';
      await user.save();

      expect(user.password).not.toBe('newpassword');
      expect(user.password).not.toBe(oldHashedPassword);
      expect(await user.matchPassword('newpassword')).toBe(true);
    });

    it('should not hash password when other fields are updated', async () => {
      const user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });

      const oldHashedPassword = user.password;
      user.userName = 'newUserName';
      await user.save();

      expect(user.password).toBe(oldHashedPassword);
    });

    it('should not hash password for guest users', async () => {
      const user = await User.create({
        userName: 'guestUser',
        isGuest: true,
      });

      expect(user.password).toBeNull();
    });
  });

  describe('Guest User Check', () => {
    it('should return true for guest users', async () => {
      const guestUser = await User.create({
        userName: 'guestUser',
        isGuest: true,
      });

      const isGuest = await User.isGuestUser(guestUser._id.toString());
      expect(isGuest).toBe(true);
    });

    it('should return false for registered users', async () => {
      const registeredUser = await User.create({
        userName: 'registeredUser',
        email: 'test@example.com',
        password: 'password123',
      });

      const isGuest = await User.isGuestUser(registeredUser._id.toString());
      expect(isGuest).toBe(false);
    });

    it('should throw error when user does not exist', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      await expect(User.isGuestUser(nonExistentUserId)).rejects.toThrow(
        `User not found with id: ${nonExistentUserId}`,
      );
    });

    it('should throw error when user id is invalid', async () => {
      const invalidUserId = 'invalid-user-id';
      await expect(User.isGuestUser(invalidUserId)).rejects.toThrow();
    });
  });

  describe('test login', () => {
    const testUserId = new ObjectId().toString();
    beforeEach(async () => {
      await User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return user when email and password are correct', async () => {
      const user = await User.login('test@example.com', 'password123');
      expect(user._id.toString()).toBe(testUserId);
    });

    it('should throw error when email is incorrect', async () => {
      await expect(
        User.login('wrong@example.com', 'password123'),
      ).rejects.toThrow(new AppError(401, errors.EMAIL_NOT_FOUND));
    });

    it('should throw error when password is incorrect', async () => {
      await expect(
        User.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(new AppError(401, errors.WRONG_PASSWORD));
    });
  });

  describe('test updateEmail', () => {
    const testUserId = new ObjectId().toString();
    beforeEach(async () => {
      await User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should update email correctly', async () => {
      await User.updateEmail(testUserId, 'new@example.com');
      const user = await User.findById(testUserId);
      expect(user?.email).toBe('new@example.com');
    });

    it('should throw error when user does not exist', async () => {
      const nonExistentUserId = new ObjectId().toString();
      await expect(
        User.updateEmail(nonExistentUserId, 'new@example.com'),
      ).rejects.toThrow(new AppError(401, errors.USER_NOT_FOUND));
    });

    it('should throw error when email is already registered', async () => {
      await User.create({
        _id: new ObjectId().toString(),
        userName: 'testUser',
        email: 'new@example.com',
        password: 'password123',
      });

      await expect(
        User.updateEmail(testUserId, 'new@example.com'),
      ).rejects.toThrow(new AppError(400, errors.EMAIL_ALREADY_REGISTERED));
    });
  });

  describe('test changePassword', () => {
    const testUserId = new ObjectId().toString();
    beforeEach(async () => {
      await User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should update password correctly', async () => {
      await User.changePassword(testUserId, 'password123', 'newpassword');
      const user = await User.findById(testUserId);
      expect(await user?.matchPassword('newpassword')).toBe(true);
    });

    it('should throw error when user does not exist', async () => {
      const nonExistentUserId = new ObjectId().toString();
      await expect(
        User.changePassword(nonExistentUserId, 'password123', 'newpassword'),
      ).rejects.toThrow(new AppError(401, errors.USER_NOT_FOUND));
    });

    it('should throw error when password is incorrect', async () => {
      await expect(
        User.changePassword(testUserId, 'wrongpassword', 'newpassword'),
      ).rejects.toThrow(new AppError(401, errors.WRONG_PASSWORD));
    });

    it('should throw error when user is guest', async () => {
      const guestUserId = new ObjectId().toString();
      await User.create({
        _id: guestUserId,
        password: 'password123',
        isGuest: true,
      });

      await expect(
        User.changePassword(guestUserId, 'password123', 'newpassword'),
      ).rejects.toThrow(new AppError(403, errors.PERMISSION_DENIED));
    });
  });

  describe('test resetPassword', () => {
    const testUserId = new ObjectId().toString();
    beforeEach(async () => {
      await User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should update password correctly', async () => {
      await User.resetPassword('test@example.com', 'newpassword');
      const user = await User.findById(testUserId);
      expect(await user?.matchPassword('newpassword')).toBe(true);
    });

    it('should throw error when user does not exist', async () => {
      await expect(
        User.resetPassword('wrong@example.com', 'newpassword'),
      ).rejects.toThrow(new AppError(401, errors.USER_NOT_FOUND));
    });
  });
});
