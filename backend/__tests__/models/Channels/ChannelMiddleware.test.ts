import mongoose from 'mongoose';
import Channels from '@/models/Channels';

describe('ChannelMiddleware', () => {
  const adminId = new mongoose.Types.ObjectId();
  const channelId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Channels.deleteOne({ _id: channelId });
  });

  describe('hashPassword ミドルウェア', () => {
    it('パスワードが有効で変更された場合、パスワードをハッシュ化する', async () => {
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'plaintext123',
      });

      await channel.save();

      expect(channel.password).not.toBe('plaintext123');
      expect(channel.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
      ); // bcrypt形式
    });

    it('パスワードが有効だが変更されていない場合、ハッシュ化しない', async () => {
      // 最初にチャンネルを作成
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'plaintext123',
      });

      await channel.save();
      const originalHash = channel.password;

      // パスワード以外のフィールドを変更
      channel.channelName = 'Updated Channel';
      await channel.save();

      expect(channel.password).toBe(originalHash);
    });

    it('passwordEnabledがfalseの場合、パスワードをクリアする', async () => {
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: false,
        password: 'somepassword',
      });

      await channel.save();

      expect(channel.passwordEnabled).toBe(false);
      expect(channel.password).toBeUndefined();
    });

    it('passwordEnabledがfalseでpasswordが設定されていない場合、パスワードをクリアする', async () => {
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: false,
        // passwordは設定されていない
      });

      await channel.save();

      expect(channel.passwordEnabled).toBe(false);
      expect(channel.password).toBeUndefined();
    });

    it('パスワードが変更された場合、新しいハッシュが生成される', async () => {
      // 最初にチャンネルを作成
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'firstpassword123',
      });

      await channel.save();
      const firstHash = channel.password;

      // パスワードを変更
      channel.password = 'secondpassword123';
      await channel.save();

      expect(channel.password).not.toBe(firstHash);
      expect(channel.password).not.toBe('secondpassword123');
      expect(channel.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
      );
    });
  });

  describe('パスワード検証', () => {
    it('ハッシュ化されたパスワードで正しく認証できる', async () => {
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'testpassword123',
      });

      await channel.save();

      // パスワードが正しくハッシュ化されていることを確認
      const isMatch = await channel.matchPassword('testpassword123');
      expect(isMatch).toBe(true);
    });

    it('間違ったパスワードで認証に失敗する', async () => {
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: 'testpassword123',
      });

      await channel.save();

      const isMatch = await channel.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('エッジケース', () => {
    it('非常に長いパスワードでも正しくハッシュ化される', async () => {
      const longPassword = 'a'.repeat(1000);
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: longPassword,
      });

      await channel.save();

      expect(channel.password).not.toBe(longPassword);
      expect(channel.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
      );
    });

    it('特殊文字を含むパスワードでも正しくハッシュ化される', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const channel = new Channels({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: adminId,
        passwordEnabled: true,
        password: specialPassword,
      });

      await channel.save();

      expect(channel.password).not.toBe(specialPassword);
      expect(channel.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
      );
    });
  });
});
