import mongoose from 'mongoose';
import GameUsers from '@/models/GameUsers';
import Users from '@/models/Users';

describe('GameUserSchema', () => {
  const gameId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      GameUsers.deleteOne({ gameId, userId }),
      Users.deleteOne({ _id: userId }),
    ]);
    await Users.create({
      _id: userId,
      userName: 'TestUser',
      email: 'GameUserSchema@example.com',
      password: 'password123',
    });
  });

  describe('スキーマの基本構造', () => {
    it('必要なフィールドが存在する', async () => {
      const gameUser = await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
        isPlaying: true,
      });

      expect(gameUser.gameId).toBeDefined();
      expect(gameUser.userId).toBeDefined();
      expect(gameUser.role).toBeDefined();
      expect(gameUser.isPlaying).toBeDefined();
      expect(gameUser.createdAt).toBeDefined();
    });

    it('gameIdフィールドがObjectId型である', async () => {
      const gameUser = await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      expect(gameUser.gameId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(gameUser.gameId.toString()).toBe(gameId.toString());
    });

    it('userIdフィールドがObjectId型である', async () => {
      const gameUser = await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      expect(gameUser.userId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(gameUser.userId.toString()).toBe(userId.toString());
    });

    it('roleフィールドが文字列型である', async () => {
      const gameUser = await GameUsers.create({
        gameId,
        userId,
        role: 'seer',
      });

      expect(typeof gameUser.role).toBe('string');
      expect(gameUser.role).toBe('seer');
    });

    it('isPlayingフィールドが真偽値型である', async () => {
      const gameUser = await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
        isPlaying: true,
      });

      expect(typeof gameUser.isPlaying).toBe('boolean');
      expect(gameUser.isPlaying).toBe(true);
    });
  });

  describe('デフォルト値', () => {
    it('roleフィールドのデフォルト値がspectatorである', async () => {
      const gameUser = await GameUsers.create({
        gameId,
        userId,
      });

      expect(gameUser.role).toBe('spectator');
    });

    it('isPlayingフィールドのデフォルト値がfalseである', async () => {
      const gameUser = await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      expect(gameUser.isPlaying).toBe(false);
    });
  });

  describe('バリデーション', () => {
    it('gameIdが必須である', async () => {
      await expect(
        GameUsers.create({
          userId,
          role: 'villager',
        }),
      ).rejects.toThrow();
    });

    it('userIdが必須である', async () => {
      await expect(
        GameUsers.create({
          gameId,
          role: 'villager',
        }),
      ).rejects.toThrow();
    });

    it('roleフィールドが有効な値のみを受け入れる', async () => {
      const validRoles = [
        'villager',
        'seer',
        'medium',
        'hunter',
        'freemason',
        'werewolf',
        'madman',
        'fanatic',
        'fox',
        'immoralist',
        'spectator',
      ];

      for (const role of validRoles) {
        const gameUser = await GameUsers.create({
          gameId,
          userId,
          role: role as any,
        });
        expect(gameUser.role).toBe(role);
        await GameUsers.deleteOne({ gameId, userId });
      }
    });

    it('無効なrole値でエラーが発生する', async () => {
      await expect(
        GameUsers.create({
          gameId,
          userId,
          role: 'invalid' as any,
        }),
      ).rejects.toThrow();
    });

    it('gameIdとuserIdの組み合わせの重複を防ぐ', async () => {
      // 最初のゲームユーザーを作成
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      // 同じ組み合わせで2番目のゲームユーザーを作成しようとする
      await expect(
        GameUsers.create({
          gameId,
          userId,
          role: 'werewolf',
        }),
      ).rejects.toThrow();
    });

    it('異なるゲームで同じユーザーを追加できる', async () => {
      const secondGameId = new mongoose.Types.ObjectId();

      // 最初のゲームにユーザーを追加
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      // 2番目のゲームに同じユーザーを追加
      await GameUsers.create({
        gameId: secondGameId,
        userId,
        role: 'werewolf',
      });

      // 両方のゲームユーザーが存在することを確認
      const allGameUsers = await GameUsers.find({ userId });
      expect(allGameUsers).toHaveLength(2);
      await GameUsers.deleteOne({ gameId: secondGameId, userId });
    });

    it('同じゲームで異なるユーザーを追加できる', async () => {
      const secondUserId = new mongoose.Types.ObjectId();

      // 最初のユーザーをゲームに追加
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      // 2番目のユーザーを同じゲームに追加
      await GameUsers.create({
        gameId,
        userId: secondUserId,
        role: 'seer',
      });

      // 両方のゲームユーザーが存在することを確認
      const allGameUsers = await GameUsers.find({ gameId });
      expect(allGameUsers).toHaveLength(2);
      await GameUsers.deleteOne({ gameId, userId: secondUserId });
    });
  });

  describe('スキーマ設定', () => {
    it('_idフィールドが存在する', async () => {
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      const savedGameUser = await GameUsers.findOne({
        gameId,
        userId,
      });
      expect(savedGameUser?._id).toBeDefined();
    });

    it('__vフィールドが存在しない', async () => {
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      const savedGameUser = await GameUsers.findOne({
        gameId,
        userId,
      });
      expect(savedGameUser?.__v).toBeUndefined();
    });

    it('createdAtフィールドが自動設定される', async () => {
      const beforeCreation = new Date();
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      const savedGameUser = await GameUsers.findOne({
        gameId,
        userId,
      });
      expect(savedGameUser?.createdAt).toBeDefined();
      expect(savedGameUser?.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
    });

    it('timestampsが正しく設定されている（createdAtのみ）', async () => {
      const gameUser = await GameUsers.create({
        gameId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        role: 'villager',
      });

      expect(gameUser.createdAt).toBeDefined();
      expect(gameUser.createdAt).toBeInstanceOf(Date);
      expect((gameUser as any).updatedAt).toBeUndefined();
    });
  });

  describe('インデックス', () => {
    it('複合ユニークインデックスが正しく作成される', async () => {
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      const indexes = await GameUsers.listIndexes();
      const compoundIndex = indexes.find(
        (index: any) =>
          index.key && index.key.gameId === 1 && index.key.userId === 1,
      );

      expect(compoundIndex).toBeDefined();
      expect(compoundIndex?.unique).toBe(true);
    });

    it('userIdにインデックスが作成される', async () => {
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      const indexes = await GameUsers.listIndexes();
      const userIdIndex = indexes.find(
        (index: any) => index.key && index.key.userId === 1,
      );

      expect(userIdIndex).toBeDefined();
    });
  });

  describe('参照関係', () => {
    it('userIdがUsersモデルを正しく参照する', async () => {
      await GameUsers.create({
        gameId,
        userId,
        role: 'villager',
      });

      // populateでユーザー情報を取得
      const populatedGameUser = await GameUsers.findOne({
        gameId,
        userId,
      }).populate('userId', 'userName email');

      expect(populatedGameUser?.userId).toBeDefined();
      expect((populatedGameUser?.userId as any).userName).toBe('TestUser');
      expect((populatedGameUser?.userId as any).email).toBe(
        'GameUserSchema@example.com',
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なObjectIdでエラーが発生する', async () => {
      const invalidObjectId = 'invalid-id';

      await expect(
        GameUsers.create({
          gameId: invalidObjectId as any,
          userId,
          role: 'villager',
        }),
      ).rejects.toThrow();
    });
  });
});
