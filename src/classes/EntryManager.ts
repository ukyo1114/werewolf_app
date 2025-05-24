import GameManager from './GameManager';
import { Events } from '../app';

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

  async register(userId: string, socketId: string): Promise<void> {
    if (this.isProcessing)
      throw new Error('ゲームの開始処理中です。しばらくお待ちください。');

    this.users[socketId] = { userId };

    if (Object.keys(this.users).length === this.MAX_USERS) {
      this.isProcessing = true;
      await this.startGame();
    }

    this.entryUpdate();
  }

  cancel(socketId: string): void {
    if (this.isProcessing)
      throw new Error('ゲームの開始処理中です。キャンセルできません。');

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
      console.error('error:', error);
      entryEvents.emit('gameCreationFailed', this.channelId);
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
