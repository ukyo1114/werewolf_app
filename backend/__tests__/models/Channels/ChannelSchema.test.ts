import mongoose from 'mongoose';
import Channels from '@/models/Channels';

describe('ChannelSchema', () => {
  const adminId = new mongoose.Types.ObjectId();
  const channelId = new mongoose.Types.ObjectId();

  afterEach(async () => {
    await Channels.deleteOne({ _id: channelId });
  });

  describe('スキーマのバリデーション', () => {
    it('必須フィールドが正しく設定されている', () => {
      const channel = new Channels({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
      });

      expect(channel.channelName).toBe('Test Channel');
      expect(channel.channelDescription).toBe('A test channel');
      expect(channel.channelAdmin).toBe(adminId);
    });

    it('デフォルト値が正しく設定されている', () => {
      const channel = new Channels({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
      });

      expect(channel.passwordEnabled).toBe(false);
      expect(channel.denyGuests).toBe(false);
      expect(channel.numberOfPlayers).toBe(10);
      expect(channel.deletedAt).toBeUndefined();
    });

    it('channelNameの最大長制限が正しく動作する', () => {
      const longName = 'a'.repeat(51);
      const channel = new Channels({
        channelName: longName,
        channelDescription: 'A test channel',
        channelAdmin: adminId,
      });

      const validationError = channel.validateSync();
      expect(validationError?.errors?.channelName).toBeDefined();
    });

    it('channelDescriptionの最大長制限が正しく動作する', () => {
      const longDescription = 'a'.repeat(2001);
      const channel = new Channels({
        channelName: 'Test Channel',
        channelDescription: longDescription,
        channelAdmin: adminId,
      });

      const validationError = channel.validateSync();
      expect(validationError?.errors?.channelDescription).toBeDefined();
    });

    it('numberOfPlayersの範囲制限が正しく動作する', () => {
      // 最小値未満
      const channelTooSmall = new Channels({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        numberOfPlayers: 4,
      });

      let validationError = channelTooSmall.validateSync();
      expect(validationError?.errors?.numberOfPlayers).toBeDefined();

      // 最大値超過
      const channelTooLarge = new Channels({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        numberOfPlayers: 21,
      });

      validationError = channelTooLarge.validateSync();
      expect(validationError?.errors?.numberOfPlayers).toBeDefined();
    });
  });

  describe('パスワード関連のバリデーション', () => {
    it('passwordEnabledがtrueの場合、passwordが必須', () => {
      const channel = new Channels({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        // passwordが設定されていない
      });

      const validationError = channel.validateSync();
      expect(validationError?.errors?.password).toBeDefined();
    });

    it('passwordEnabledがfalseの場合、passwordは任意', () => {
      const channel = new Channels({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: false,
        // passwordが設定されていなくてもOK
      });

      const validationError = channel.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('パスワードの最小長制限が正しく動作する', () => {
      const channel = new Channels({
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: '1234567', // 8文字未満
      });

      const validationError = channel.validateSync();
      expect(validationError?.errors?.password).toBeDefined();
    });
  });

  describe('タイムスタンプ', () => {
    it('createdAtとupdatedAtが自動的に設定される', async () => {
      const channel = await Channels.create({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
      });

      expect(channel.createdAt).toBeDefined();
      expect(channel.updatedAt).toBeDefined();
      expect(channel.createdAt).toBeInstanceOf(Date);
      expect(channel.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('インデックス', () => {
    it('channelAdminのインデックスが作成されている', async () => {
      const indexes = await Channels.collection.indexes();
      const adminIndex = indexes.find(
        (index) => index.key && index.key.channelAdmin === 1,
      );

      expect(adminIndex).toBeDefined();
    });
  });
});
