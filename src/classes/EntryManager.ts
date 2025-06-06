import GameManager from './GameManager';
import { appState, Events } from '../app';
import { errors } from '../config/messages';

const { entryManagers } = appState;
const { entryEvents } = Events;

export default class EntryManager {
  public channelId: string;
  public users: Record<string, { userId: string }> = {};
  public MAX_USERS: number;
  public isProcessing: boolean = false;

  constructor(channelId: string, max_users: number = 10) {
    this.channelId = channelId;
    this.MAX_USERS = max_users;
  }

  static createEntryManager(
    channelId: string,
    max_users: number = 10,
  ): EntryManager {
    if (entryManagers[channelId]) return entryManagers[channelId];
    entryManagers[channelId] = new EntryManager(channelId, max_users);
    return entryManagers[channelId];
  }

  async register(userId: string, socketId: string): Promise<void> {
    if (this.isProcessing) throw new Error(errors.GAME_START_PROCESSING);

    this.users[socketId] = { userId };

    if (Object.keys(this.users).length === this.MAX_USERS) {
      this.isProcessing = true;
      await this.startGame();
    }

    this.entryUpdate();
  }

  cancel(socketId: string): void {
    if (this.isProcessing) throw new Error(errors.GAME_START_PROCESSING);

    delete this.users[socketId];
    this.entryUpdate();
  }

  entryUpdate(): void {
    const data = {
      channelId: this.channelId,
      userList: this.getUserList(),
    };
    entryEvents.emit('entryUpdate', data);
  }

  getUserList(): string[] {
    return Object.values(this.users).map((user) => user.userId);
  }

  async startGame(): Promise<void> {
    const userList = this.getUserList();

    try {
      const gameId = await GameManager.createGameManager(
        this.channelId,
        userList,
      );
      this.emitGameStart(gameId);
    } catch (error) {
      entryEvents.emit('gameCreationFailed', this.channelId);
      throw error;
    } finally {
      // ゲームの開始処理が終了したら、ユーザーリストと処理フラグをリセット
      this.users = {};
      this.isProcessing = false;
    }
  }

  emitGameStart(gameId: string): void {
    const data = {
      users: Object.keys(this.users),
      gameId,
    };
    entryEvents.emit('gameStart', data);
  }
}
