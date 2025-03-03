import User from '../models/userModel';
import Game from '../models/gameModel';
import { games } from './GameInstanceManager';
import GameManager from './GameManager';
import { appState, Events } from '../app';

const { entryEvents } = Events;
const { gameManagers } = appState;

export default class EntryManager {
  public channelId: string;
  public users: {
    [key: string]: string;
  } = {};
  public MAX_USERS: number;
  public isProcessing: boolean;

  constructor(channelId: string, max_users: number) {
    this.channelId = channelId;
    this.MAX_USERS = max_users;
    this.isProcessing = false;
  }

  async register(userId: string, socketId: string) {
    if (this.isProcessing) return;

    this.users[socketId] = userId;

    if (Object.keys(this.users).length === this.MAX_USERS) {
      this.isProcessing = true;
      await this.startGame();
    }

    this.entryUpdate();
  }

  cancel(socketId: string) {
    if (this.isProcessing) return;

    delete this.users[socketId];
    this.entryUpdate();
  }

  getUserList(): string[] {
    return Object.values(this.users);
  }

  entryUpdate() {
    const userList = this.getUserList();

    entryEvents.emit('entryUpdate', {
      channelId: this.channelId,
      userList,
    });
  }

  async startGame() {
    try {
      const channelId = this.channelId;

      // ユーザー情報を取得
      const userList = this.getUserList();
      const dbUsers = await User.find({ _id: { $in: userList } })
        .select('_id userName')
        .lean();
      const users = dbUsers.map((user) => ({
        userId: user._id.toString(),
        userName: user.userName,
      }));

      // gameIdを取得
      const { _id } = await Game.create({
        channelId,
        numberOfPlayers: this.MAX_USERS,
      });
      const gameId = _id.toString();

      // ゲームインスタンスを作成
      gameManagers[gameId] = new GameManager(this.channelId, gameId, users);

      // プレイヤー情報をデータベースに登録
      await gameManagers[gameId].playerManager.registerPlayersInDB();

      // 各プレイヤーに通知
      const socketIds = Object.keys(this.users);
      entryEvents.emit('gameStart', { socketIds, gameId });
    } catch (error) {
      console.error('error:', error);
      entryEvents.emit('gameCreationFailed', this.channelId);
    } finally {
      // カウンターをリセット
      this.users = {};
      this.isProcessing = false;
    }
  }
}
