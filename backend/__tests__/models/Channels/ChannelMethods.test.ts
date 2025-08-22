import mongoose from 'mongoose';
import Channels from '@/models/Channels';

describe('ChannelMethods', () => {
  const adminId = new mongoose.Types.ObjectId();
  const channelId = new mongoose.Types.ObjectId();
  let channel: any;

  beforeEach(async () => {
    // テスト用のチャンネルを作成
    channel = await Channels.create({
      _id: channelId,
      channelName: 'Test Channel',
      channelDescription: 'A test channel',
      channelAdmin: adminId,
      passwordEnabled: true,
      password: 'securepass123',
    });
  });

  afterEach(async () => {
    await Channels.deleteOne({ _id: channelId });
  });

  describe('matchPassword', () => {
    it('正しいパスワードでtrueを返す', async () => {
      const result = await channel.matchPassword('securepass123');
      expect(result).toBe(true);
    });

    it('間違ったパスワードでfalseを返す', async () => {
      const result = await channel.matchPassword('wrongpassword');
      expect(result).toBe(false);
    });

    it('パスワードが設定されていない場合、エラーを投げる', async () => {
      const channelWithoutPassword = await Channels.create({
        channelName: 'No Password Channel',
        channelDescription: 'A channel without password',
        channelAdmin: adminId,
        passwordEnabled: false,
      });

      await expect(
        channelWithoutPassword.matchPassword('anypassword'),
      ).rejects.toThrow();
      await Channels.deleteOne({ _id: channelWithoutPassword._id });
    });
  });

  describe('delete (ソフトデリート)', () => {
    it('deletedAtフィールドに現在の日時を設定する', async () => {
      const beforeDelete = new Date();
      await channel.delete();
      const afterDelete = new Date();

      expect(channel.deletedAt).toBeDefined();
      expect(channel.deletedAt).toBeInstanceOf(Date);
      expect(channel.deletedAt.getTime()).toBeGreaterThanOrEqual(
        beforeDelete.getTime(),
      );
      expect(channel.deletedAt.getTime()).toBeLessThanOrEqual(
        afterDelete.getTime(),
      );
    });

    it('チャンネルをデータベースから完全に削除しない', async () => {
      await channel.delete();

      const deletedChannel = await Channels.findById(channelId);
      expect(deletedChannel).toBeDefined();
      expect(deletedChannel?.deletedAt).toBeDefined();
    });
  });

  describe('update', () => {
    it('チャンネル名を更新する', async () => {
      const updateData = {
        channelName: 'Updated Channel Name',
        channelDescription: 'Updated description',
        passwordEnabled: true,
        password: 'newpassword123',
        denyGuests: true,
        numberOfPlayers: 15,
      };

      const updatedChannel = await channel.update(updateData);

      expect(updatedChannel.channelName).toBe('Updated Channel Name');
      expect(updatedChannel.channelDescription).toBe('Updated description');
      expect(updatedChannel.passwordEnabled).toBe(true);
      expect(updatedChannel.denyGuests).toBe(true);
      expect(updatedChannel.numberOfPlayers).toBe(15);
    });

    it('空文字列の場合は既存の値を保持する', async () => {
      const originalName = channel.channelName;
      const originalDescription = channel.channelDescription;

      const updateData = {
        channelName: '',
        channelDescription: '',
        passwordEnabled: false,
        password: '',
        denyGuests: true,
        numberOfPlayers: 12,
      };

      const updatedChannel = await channel.update(updateData);

      expect(updatedChannel.channelName).toBe(originalName);
      expect(updatedChannel.channelDescription).toBe(originalDescription);
      expect(updatedChannel.passwordEnabled).toBe(false);
      expect(updatedChannel.denyGuests).toBe(true);
      expect(updatedChannel.numberOfPlayers).toBe(12);
    });

    it('パスワードが8文字未満の場合は既存のパスワードを保持する', async () => {
      const originalPassword = channel.password;

      const updateData = {
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        passwordEnabled: true,
        password: '123', // 8文字未満
        denyGuests: false,
        numberOfPlayers: 10,
      };

      const updatedChannel = await channel.update(updateData);

      expect(updatedChannel.password).toBe(originalPassword);
    });

    it('パスワードが8文字以上の場合は新しいパスワードを設定する', async () => {
      const updateData = {
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        passwordEnabled: true,
        password: 'newpassword123', // 8文字以上
        denyGuests: false,
        numberOfPlayers: 10,
      };

      const updatedChannel = await channel.update(updateData);

      expect(updatedChannel.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
      ); // bcrypt形式;
      const isMatch = await updatedChannel.matchPassword('newpassword123');
      expect(isMatch).toBe(true);
    });

    it('更新後にデータベースに保存される', async () => {
      const updateData = {
        channelName: 'Updated Channel',
        channelDescription: 'Updated description',
        passwordEnabled: false,
        password: '',
        denyGuests: true,
        numberOfPlayers: 15,
      };

      await channel.update(updateData);

      // データベースから再取得して確認
      const savedChannel = await Channels.findById(channelId);
      expect(savedChannel?.channelName).toBe('Updated Channel');
      expect(savedChannel?.denyGuests).toBe(true);
      expect(savedChannel?.numberOfPlayers).toBe(15);
    });
  });
});
