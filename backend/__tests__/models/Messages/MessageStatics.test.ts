import mongoose from 'mongoose';
import Messages from '@/models/Messages';

describe('MessageStatics', () => {
  const channelId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Messages.deleteMany({ channelId });
  });

  describe('getIndex', () => {
    it('チャンネルのメッセージインデックスを取得できる', async () => {
      // テスト用メッセージを作成
      const message1 = await Messages.create({
        channelId,
        userId,
        message: 'テストメッセージ1',
        messageType: 'normal',
      });

      const message2 = await Messages.create({
        channelId,
        userId,
        message: 'テストメッセージ2',
        messageType: 'normal',
        replyTo: message1._id,
      });

      const result = await Messages.getIndex(channelId.toString());

      expect(result).toHaveLength(2);
      expect(result[0]._id.toString()).toBe(message2._id.toString());
      expect(result[0].createdAt).toEqual(message2.createdAt);
      expect(result[0].replyTo?.toString()).toBe(message1._id.toString());
      expect(result[1]._id.toString()).toBe(message1._id.toString());
      expect(result[1].createdAt).toEqual(message1.createdAt);
      expect(result[1].replyTo).toBeUndefined();
    });

    it('messageTypeフィルターで特定のメッセージタイプのみ取得できる', async () => {
      // 異なるタイプのメッセージを作成
      await Messages.create({
        channelId,
        userId,
        message: '通常メッセージ',
        messageType: 'normal',
      });

      await Messages.create({
        channelId,
        userId,
        message: 'システムメッセージ',
        messageType: 'system',
      });

      // normalタイプのみ取得
      const normalMessages = await Messages.getIndex(channelId.toString(), [
        'normal',
      ]);
      expect(normalMessages).toHaveLength(1);

      // systemタイプのみ取得
      const systemMessages = await Messages.getIndex(channelId.toString(), [
        'system',
      ]);
      expect(systemMessages).toHaveLength(1);

      // 複数タイプを指定
      const multiTypeMessages = await Messages.getIndex(channelId.toString(), [
        'normal',
        'system',
      ]);
      expect(multiTypeMessages).toHaveLength(2);
    });

    it('空のチャンネルで空配列を返す', async () => {
      const emptyChannelId = new mongoose.Types.ObjectId();
      const result = await Messages.getIndex(emptyChannelId.toString());

      expect(result).toHaveLength(0);
    });

    it('3000件を超えるメッセージがある場合でも3000件まで取得する', async () => {
      // 3001件のメッセージを作成
      const messages = [];
      for (let i = 0; i < 3001; i++) {
        messages.push({
          channelId,
          userId,
          message: `テストメッセージ${i}`,
          messageType: 'normal',
        });
      }

      await Messages.insertMany(messages);

      const result = await Messages.getIndex(channelId.toString());

      expect(result).toHaveLength(3000);
    });
  });
});
