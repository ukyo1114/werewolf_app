import mongoose from 'mongoose';
import GameUsers from '@/models/GameUsers';
import Users from '@/models/Users';

describe('GameUserStatics', () => {
  const gameId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const secondGameId = new mongoose.Types.ObjectId();
  const secondUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      GameUsers.deleteMany({ gameId }),
      GameUsers.deleteMany({ gameId: secondGameId }),
      Users.deleteOne({ _id: userId }),
      Users.deleteOne({ _id: secondUserId }),
    ]);
    await Users.create({
      _id: userId,
      userName: 'TestUser',
      email: 'GameUserStatics@example.com',
      pic: 'pic.jpg',
      password: 'password123',
    });
    await Users.create({
      _id: secondUserId,
      userName: 'SecondUser',
      email: 'SecondUser.GameUserStatics@example.com',
      pic: 'pic2.jpg',
      password: 'password123',
    });
  });

  describe('joinGame', () => {
    it('新しいユーザーをゲームに参加させる', async () => {
      await GameUsers.joinGame(gameId.toString(), userId.toString());

      const gameUser = await GameUsers.findOne({ gameId, userId });
      expect(gameUser).toBeDefined();
      expect(gameUser?.gameId.toString()).toBe(gameId.toString());
      expect(gameUser?.userId.toString()).toBe(userId.toString());
      expect(gameUser?.role).toBe('spectator');
      expect(gameUser?.isPlaying).toBe(false);
    });

    it('既に参加しているユーザーは重複して作成されない', async () => {
      // 最初の参加
      await GameUsers.joinGame(gameId.toString(), userId.toString());

      // 2回目の参加（重複しない）
      await GameUsers.joinGame(gameId.toString(), userId.toString());

      const gameUsers = await GameUsers.find({ gameId, userId });
      expect(gameUsers).toHaveLength(1);
    });

    it('異なるゲームに同じユーザーを参加させることができる', async () => {
      await GameUsers.joinGame(gameId.toString(), userId.toString());
      await GameUsers.joinGame(secondGameId.toString(), userId.toString());

      const gameUsers = await GameUsers.find({ userId });
      expect(gameUsers).toHaveLength(2);
      expect(gameUsers[0].gameId.toString()).toBe(gameId.toString());
      expect(gameUsers[1].gameId.toString()).toBe(secondGameId.toString());
    });
  });

  describe('getGameUsers', () => {
    it('指定されたゲームのユーザー一覧を取得する', async () => {
      await GameUsers.create({
        gameId,
        userId,
        userName: 'TestUser',
        pic: 'pic.jpg',
        role: 'villager',
      });
      await GameUsers.create({
        gameId,
        userId: secondUserId,
        userName: 'SecondUser',
        pic: 'pic2.jpg',
        role: 'seer',
      });

      const users = await GameUsers.getGameUsers(gameId.toString());

      expect(users).toHaveLength(2);
      expect(users).toContainEqual({
        userId: userId,
        userName: 'TestUser',
        pic: 'pic.jpg',
      });
      expect(users).toContainEqual({
        userId: secondUserId,
        userName: 'SecondUser',
        pic: 'pic2.jpg',
      });
    });

    it('指定されたゲームにユーザーがいない場合は空配列を返す', async () => {
      const users = await GameUsers.getGameUsers(gameId.toString());
      expect(users).toHaveLength(0);
    });

    it('存在しないゲームIDで空配列を返す', async () => {
      const nonExistentGameId = new mongoose.Types.ObjectId().toString();
      const users = await GameUsers.getGameUsers(nonExistentGameId);
      expect(users).toHaveLength(0);
    });

    it('異なるゲームのユーザーは含まれない', async () => {
      await GameUsers.create({ gameId, userId, role: 'villager' });
      await GameUsers.create({
        gameId: secondGameId,
        userId: secondUserId,
        role: 'werewolf',
      });
      await GameUsers.createIndexes();

      const users = await GameUsers.getGameUsers(gameId.toString());
      expect(users).toHaveLength(1);
      expect(users[0].userId.toString()).toBe(userId.toString());
    });
  });

  describe('getGamePlayers', () => {
    it('指定されたゲームのプレイヤー一覧を取得する（spectatorを除く）', async () => {
      await GameUsers.create({
        gameId,
        userId,
        userName: 'TestUser',
        pic: 'pic.jpg',
        role: 'villager',
      });
      await GameUsers.create({
        gameId,
        userId: secondUserId,
        userName: 'SecondUser',
        pic: 'pic2.jpg',
        role: 'seer',
      });
      await GameUsers.create({
        gameId,
        userId: new mongoose.Types.ObjectId(),
        userName: 'SpectatorUser',
        pic: 'pic3.jpg',
        role: 'spectator',
      });

      const players = await GameUsers.getGamePlayers(gameId.toString());

      expect(players).toHaveLength(2);
      expect(players).toContainEqual({
        userId: userId,
        userName: 'TestUser',
        pic: 'pic.jpg',
      });
      expect(players).toContainEqual({
        userId: secondUserId,
        userName: 'SecondUser',
        pic: 'pic2.jpg',
      });
    });

    it('spectatorのみの場合は空配列を返す', async () => {
      await GameUsers.create({
        gameId,
        userId,
        userName: 'SpectatorUser',
        pic: 'pic.jpg',
        role: 'spectator',
      });

      const players = await GameUsers.getGamePlayers(gameId.toString());
      expect(players).toHaveLength(0);
    });
  });

  describe('isUserPlaying', () => {
    it('プレイ中のユーザーの場合、ゲームIDを返す', async () => {
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
        isPlaying: true,
      });

      const playingGameId = await GameUsers.isUserPlaying(userId.toString());

      expect(playingGameId).toBe(gameId.toString());
    });

    it('プレイしていないユーザーの場合、nullを返す', async () => {
      await GameUsers.create({
        gameId,
        userId,
        role: 'spectator',
        isPlaying: false,
      });

      const playingGameId = await GameUsers.isUserPlaying(userId.toString());

      expect(playingGameId).toBeNull();
    });

    it('存在しないユーザーIDでnullを返す', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const playingGameId = await GameUsers.isUserPlaying(nonExistentUserId);

      expect(playingGameId).toBeNull();
    });

    it('複数のゲームに参加している場合、プレイ中のゲームIDのみを返す', async () => {
      await GameUsers.create([
        { gameId, userId, role: 'spectator', isPlaying: false },
        { gameId: secondGameId, userId, role: 'villager', isPlaying: true },
      ]);

      const playingGameId = await GameUsers.isUserPlaying(userId.toString());

      expect(playingGameId).toBe(secondGameId.toString());
    });
  });

  describe('endGame', () => {
    it('指定されたゲームの全ユーザーのプレイ状態をfalseにする', async () => {
      await GameUsers.create([
        { gameId, userId, role: 'villager', isPlaying: true },
        { gameId, userId: secondUserId, role: 'seer', isPlaying: true },
      ]);

      await GameUsers.endGame(gameId.toString());

      const gameUsers = await GameUsers.find({ gameId });
      expect(gameUsers[0].isPlaying).toBe(false);
      expect(gameUsers[1].isPlaying).toBe(false);
    });

    it('既にプレイしていないユーザーは影響を受けない', async () => {
      await GameUsers.create([
        { gameId, userId, role: 'villager', isPlaying: true },
        { gameId, userId: secondUserId, role: 'spectator', isPlaying: false },
      ]);

      await GameUsers.endGame(gameId.toString());

      const gameUsers = await GameUsers.find({ gameId });
      expect(gameUsers[0].isPlaying).toBe(false);
      expect(gameUsers[1].isPlaying).toBe(false);
    });

    it('異なるゲームのユーザーは影響を受けない', async () => {
      await GameUsers.create([
        { gameId, userId, role: 'villager', isPlaying: true },
        {
          gameId: secondGameId,
          userId: secondUserId,
          role: 'werewolf',
          isPlaying: true,
        },
      ]);

      await GameUsers.endGame(gameId.toString());

      const gameUsers = await GameUsers.find({ gameId });
      const secondGameUsers = await GameUsers.find({ gameId: secondGameId });

      expect(gameUsers[0].isPlaying).toBe(false);
      expect(secondGameUsers[0].isPlaying).toBe(true);
    });

    it('存在しないゲームIDでもエラーが発生しない', async () => {
      const nonExistentGameId = new mongoose.Types.ObjectId().toString();
      await expect(GameUsers.endGame(nonExistentGameId)).resolves.not.toThrow();
    });
  });

  describe('統合テスト', () => {
    it('ゲーム参加から終了までの一連の流れ', async () => {
      // ユーザーをゲームに参加
      await GameUsers.joinGame(gameId.toString(), userId.toString());

      // 参加状態を確認
      let gameUser = await GameUsers.findOne({ gameId, userId });
      expect(gameUser).toBeDefined();
      expect(gameUser?.role).toBe('spectator');
      expect(gameUser?.isPlaying).toBe(false);

      // プレイ状態をtrueに変更
      await GameUsers.updateOne(
        { gameId, userId },
        { $set: { isPlaying: true, role: 'villager' } },
      );

      // プレイ中状態を確認
      let playingGameId = await GameUsers.isUserPlaying(userId.toString());
      expect(playingGameId).toBe(gameId.toString());

      // ゲームユーザー一覧を確認
      let users = await GameUsers.getGameUsers(gameId.toString());
      expect(users).toHaveLength(1);
      expect(users[0].userId.toString()).toBe(userId.toString());

      // ゲーム終了
      await GameUsers.endGame(gameId.toString());

      // 終了後の状態を確認
      playingGameId = await GameUsers.isUserPlaying(userId.toString());
      expect(playingGameId).toBeNull();

      gameUser = await GameUsers.findOne({ gameId, userId });
      expect(gameUser?.isPlaying).toBe(false);
    });

    it('複数のゲームとユーザーでの動作確認', async () => {
      // 複数のユーザーを複数のゲームに参加
      await GameUsers.joinGame(gameId.toString(), userId.toString());
      await GameUsers.joinGame(gameId.toString(), secondUserId.toString());
      await GameUsers.joinGame(secondGameId.toString(), userId.toString());

      // プレイ状態を設定
      await GameUsers.updateMany({ gameId }, { $set: { isPlaying: true } });
      await GameUsers.updateMany(
        { gameId: secondGameId },
        { $set: { isPlaying: true } },
      );

      // 各ゲームのユーザー数を確認
      let users1 = await GameUsers.getGameUsers(gameId.toString());
      let users2 = await GameUsers.getGameUsers(secondGameId.toString());
      expect(users1).toHaveLength(2);
      expect(users2).toHaveLength(1);

      // ユーザーのプレイ状態を確認
      let playingGameId1 = await GameUsers.isUserPlaying(userId.toString());
      let playingGameId2 = await GameUsers.isUserPlaying(
        secondUserId.toString(),
      );
      expect(playingGameId1).toBe(gameId.toString()); // 最初に見つかったゲーム
      expect(playingGameId2).toBe(gameId.toString());

      // 1つ目のゲームを終了
      await GameUsers.endGame(gameId.toString());

      // 終了後の状態を確認
      playingGameId1 = await GameUsers.isUserPlaying(userId.toString());
      playingGameId2 = await GameUsers.isUserPlaying(secondUserId.toString());
      expect(playingGameId1).toBe(secondGameId.toString());
      expect(playingGameId2).toBeNull();
    });
  });
});
