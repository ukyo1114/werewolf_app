import mongoose from 'mongoose';
import Games from '../../../src/models/Games';

describe('GameSchema', () => {
  const channelId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Games.deleteOne({ channelId });
  });

  describe('スキーマの基本構造', () => {
    it('必要なフィールドが存在する', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      expect(game.channelId).toBeDefined();
      expect(game.result).toBeDefined();
      expect(game.numberOfPlayers).toBeDefined();
      expect(game.createdAt).toBeDefined();
    });

    it('channelIdフィールドがObjectId型である', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      expect(game.channelId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(game.channelId.toString()).toBe(channelId.toString());
    });

    it('numberOfPlayersフィールドが数値型である', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 15,
      });

      expect(typeof game.numberOfPlayers).toBe('number');
      expect(game.numberOfPlayers).toBe(15);
    });
  });

  describe('デフォルト値', () => {
    it('resultフィールドのデフォルト値がrunningである', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      expect(game.result).toBe('running');
    });

    it('numberOfPlayersフィールドのデフォルト値が10である', async () => {
      const game = await Games.create({
        channelId,
      });

      expect(game.numberOfPlayers).toBe(10);
    });
  });

  describe('バリデーション', () => {
    it('channelIdが必須である', async () => {
      await expect(
        Games.create({
          numberOfPlayers: 10,
        }),
      ).rejects.toThrow();
    });

    it('resultフィールドが有効な値のみを受け入れる', async () => {
      const validResults = [
        'running',
        'villagersWin',
        'werewolvesWin',
        'foxesWin',
        'villageAbandoned',
      ];

      for (const result of validResults) {
        const game = await Games.create({
          channelId,
          result: result as any,
          numberOfPlayers: 10,
        });
        expect(game.result).toBe(result);
      }
    });

    it('無効なresult値でエラーが発生する', async () => {
      await expect(
        Games.create({
          channelId,
          result: 'invalid' as any,
          numberOfPlayers: 10,
        }),
      ).rejects.toThrow();
    });

    it('numberOfPlayersが最小値5以上である', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 5,
      });

      expect(game.numberOfPlayers).toBe(5);
    });

    it('numberOfPlayersが最大値20以下である', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 20,
      });

      expect(game.numberOfPlayers).toBe(20);
    });

    it('numberOfPlayersが範囲外でエラーが発生する', async () => {
      await expect(
        Games.create({
          channelId,
          numberOfPlayers: 4,
        }),
      ).rejects.toThrow();

      await expect(
        Games.create({
          channelId,
          numberOfPlayers: 21,
        }),
      ).rejects.toThrow();
    });
  });

  describe('スキーマ設定', () => {
    it('_idフィールドが存在する', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      expect(game._id).toBeDefined();
      expect(game._id).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('__vフィールドが存在しない', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      expect((game as any).__v).toBeUndefined();
    });

    it('createdAtフィールドが自動設定される', async () => {
      const beforeCreation = new Date();
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      expect(game.createdAt).toBeDefined();
      expect(game.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
    });

    it('updatedAtフィールドが存在しない', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      expect((game as any).updatedAt).toBeUndefined();
    });
  });

  describe('インデックス', () => {
    it('channelIdにインデックスが作成される', async () => {
      await Games.create({
        channelId,
        numberOfPlayers: 10,
      });

      const indexes = await Games.listIndexes();
      const channelIdIndex = indexes.find(
        (index: any) => index.key && index.key.channelId === 1,
      );

      expect(channelIdIndex).toBeDefined();
    });
  });

  describe('参照関係', () => {
    it('channelIdがChannelsモデルを参照している', () => {
      const schema = Games.schema;
      const channelIdField = schema.path('channelId');

      expect(channelIdField.instance).toBe('ObjectId');
      expect(channelIdField.options.ref).toBe('Channels');
    });
  });
});
