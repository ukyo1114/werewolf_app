import mongoose from 'mongoose';
import Games from '@/models/Games';
import Channels from '@/models/Channels';

describe('GameStatics', () => {
  const channelId = new mongoose.Types.ObjectId();
  const secondChannelId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      Games.deleteMany({ channelId }),
      Games.deleteMany({ channelId: secondChannelId }),
      Channels.deleteMany({ _id: { $in: [channelId, secondChannelId] } }),
    ]);
  });

  describe('getGameInfo', () => {
    it('ゲーム情報を取得できる', async () => {
      // チャンネルを作成
      await Channels.create({
        _id: channelId,
        channelName: 'Test Channel',
        channelDescription: 'A test channel',
        channelAdmin: new mongoose.Types.ObjectId(),
      });

      // ゲームを作成
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
        result: 'running',
      });

      const gameInfo = await Games.getGameInfo(game._id.toString());

      expect(gameInfo.channelId).toBe(channelId.toString());
      expect(gameInfo.channelName).toBe('Test Channel');
      expect(gameInfo.channelDescription).toBe('A test channel');
    });

    it('存在しないゲームIDでエラーを投げる', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(Games.getGameInfo(nonExistentId)).rejects.toThrow();
    });
  });

  describe('getRunningGame', () => {
    it('指定されたチャンネルの実行中ゲーム一覧を取得する', async () => {
      // 実行中ゲームを作成
      await Games.create([
        { channelId, numberOfPlayers: 10, result: 'running' },
        { channelId, numberOfPlayers: 15, result: 'running' },
      ]);

      const runningGames = await Games.getRunningGame(channelId.toString());

      expect(runningGames).toHaveLength(2);
      expect(runningGames[0].result).toBe('running');
      expect(runningGames[1].result).toBe('running');
    });

    it('指定されたチャンネルに実行中ゲームがない場合は空配列を返す', async () => {
      const runningGames = await Games.getRunningGame(channelId.toString());

      expect(runningGames).toHaveLength(0);
    });

    it('終了したゲームは含まれない', async () => {
      // 実行中と終了済みのゲームを作成
      await Games.create([
        { channelId, numberOfPlayers: 10, result: 'running' },
        { channelId, numberOfPlayers: 12, result: 'villagersWin' },
        { channelId, numberOfPlayers: 8, result: 'werewolvesWin' },
      ]);

      const runningGames = await Games.getRunningGame(channelId.toString());

      expect(runningGames).toHaveLength(1);
      expect(runningGames[0].result).toBe('running');
    });

    it('異なるチャンネルのゲームは含まれない', async () => {
      // 別チャンネルに実行中ゲームを作成
      await Games.create({
        channelId: secondChannelId,
        numberOfPlayers: 10,
        result: 'running',
      });

      const runningGames = await Games.getRunningGame(channelId.toString());

      expect(runningGames).toHaveLength(0);
    });
  });

  describe('endGame', () => {
    it('ゲームを終了状態に更新する', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
        result: 'running',
      });

      await Games.endGame(game._id.toString(), 'villagersWin');

      const updatedGame = await Games.findById(game._id);
      expect(updatedGame?.result).toBe('villagersWin');
    });

    it('異なる結果でゲームを終了できる', async () => {
      const game = await Games.create({
        channelId,
        numberOfPlayers: 10,
        result: 'running',
      });

      await Games.endGame(game._id.toString(), 'werewolvesWin');

      const updatedGame = await Games.findById(game._id);
      expect(updatedGame?.result).toBe('werewolvesWin');
    });
  });

  describe('統合テスト', () => {
    it('ゲームの作成から終了までの一連の流れ', async () => {
      // ゲームを作成
      const game = await Games.create({
        channelId,
        numberOfPlayers: 12,
        result: 'running',
      });

      // 実行中ゲーム一覧に含まれることを確認
      let runningGames = await Games.getRunningGame(channelId.toString());
      expect(runningGames).toHaveLength(1);
      expect(runningGames[0]._id.toString()).toBe(game._id.toString());

      // ゲームを終了
      await Games.endGame(game._id.toString(), 'villagersWin');

      // 実行中ゲーム一覧から除外されることを確認
      runningGames = await Games.getRunningGame(channelId.toString());
      expect(runningGames).toHaveLength(0);

      // ゲームの結果が更新されていることを確認
      const updatedGame = await Games.findById(game._id);
      expect(updatedGame?.result).toBe('villagersWin');
    });

    it('複数のゲームでの動作確認', async () => {
      // 複数のゲームを作成
      const game1 = await Games.create({
        channelId,
        numberOfPlayers: 10,
        result: 'running',
      });

      const game2 = await Games.create({
        channelId,
        numberOfPlayers: 15,
        result: 'running',
      });

      // 実行中ゲーム一覧を確認
      let runningGames = await Games.getRunningGame(channelId.toString());
      expect(runningGames).toHaveLength(2);

      // 1つ目のゲームを終了
      await Games.endGame(game1._id.toString(), 'werewolvesWin');

      // 実行中ゲーム一覧を再確認
      runningGames = await Games.getRunningGame(channelId.toString());
      expect(runningGames).toHaveLength(1);
      expect(runningGames[0]._id.toString()).toBe(game2._id.toString());

      // 2つ目のゲームも終了
      await Games.endGame(game2._id.toString(), 'foxesWin');

      // 実行中ゲームがないことを確認
      runningGames = await Games.getRunningGame(channelId.toString());
      expect(runningGames).toHaveLength(0);
    });
  });
});
