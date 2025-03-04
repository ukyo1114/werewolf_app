import User from '../models/userModel';
import Game from '../models/gameModel';
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

  async getUsersDetail() {
    const userList = this.getUserList();
    const dbUsers = await User.find({ _id: { $in: userList } })
      .select('_id userName')
      .lean();

    return dbUsers.map((user) => ({
      userId: user._id.toString(),
      userName: user.userName,
    }));
  }

  async createGame(users: { userId: string; userName: string }[]) {
    const game = await Game.create({
      channelId: this.channelId,
      numberOfPlayers: this.MAX_USERS,
    });
    const gameId = game._id.toString();

    gameManagers[gameId] = new GameManager(this.channelId, gameId, users);
    await gameManagers[gameId].playerManager.registerPlayersInDB();

    return gameId;
  }

  emitGameStart(gameId: string) {
    entryEvents.emit('gameStart', { users: Object.keys(this.users), gameId });
  }

  reset() {
    this.users = {};
    this.isProcessing = false;
  }

  async startGame() {
    try {
      const users = await this.getUsersDetail();
      const gameId = await this.createGame(users);

      // 各プレイヤーに通知
      this.emitGameStart(gameId);
    } catch (error) {
      console.error('error:', error);
      entryEvents.emit('gameCreationFailed', this.channelId);
    } finally {
      this.reset();
    }
  }
}
