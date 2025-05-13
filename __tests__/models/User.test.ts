import User from '../../src/models/User';
import { Role } from '../../src/config/types';

describe('User Model Test', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a new user with default values', async () => {
      const user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
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
        userName: 'guestUser',
        isGuest: true,
      });

      expect(user.userName).toBe('guestUser');
      expect(user.isGuest).toBe(true);
      expect(user.email).toBeUndefined();
      expect(user.password).toBeUndefined();
    });

    it('should hash password for non-guest users', async () => {
      const user = await User.create({
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
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
        pic: null,
        isGuest: false,
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
          pic: null,
          isGuest: false,
        }),
      ).rejects.toThrow();
    });

    it('should not create user with password shorter than 8 characters', async () => {
      await expect(
        User.create({
          userName: 'testUser',
          email: 'test@example.com',
          password: 'a'.repeat(7),
          pic: null,
          isGuest: false,
        }),
      ).rejects.toThrow();
    });

    it('should not create user with userName longer than 20 characters', async () => {
      await expect(
        User.create({
          userName: 'a'.repeat(21),
          email: 'test@example.com',
          password: 'password123',
          pic: null,
          isGuest: false,
        }),
      ).rejects.toThrow();
    });
  });
});
