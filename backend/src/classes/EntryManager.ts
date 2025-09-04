import GameManager from '../classes/GameManager';
import { Events } from '../config/appState';

const { entryEvents } = Events;

export default class EntryManager {
  public channelId: string;
  public MAX_USERS: number;
  public isProcessing: boolean = false;
  public users: Record<string, { userId: string }> = {};

  constructor(channelId: string, max_users: number) {
    this.channelId = channelId;
    this.MAX_USERS = max_users;
  }

  async register(userId: string, socketId: string): Promise<void> {
    if (this.isProcessing) throw new Error();
    this.users[socketId] = { userId };

    if (Object.keys(this.users).length === this.MAX_USERS) {
      this.isProcessing = true;
      await this.startGame();
    }

    this.entryUpdate();
  }

  cancel(socketId: string): void {
    if (this.isProcessing) throw new Error();

    delete this.users[socketId];
    this.entryUpdate();
  }

  getUserList(): string[] {
    return Object.values(this.users).map((user) => user.userId);
  }

  protected entryUpdate(): void {
    const data = {
      channelId: this.channelId,
      userList: this.getUserList(),
    };
    entryEvents.emit('entryUpdate', data);
  }

  protected async startGame(): Promise<void> {
    try {
      const userList = this.getUserList();
      const gameId = await GameManager.createGame(this.channelId, userList);
      this.emitGameStart(gameId);
    } catch (error: any) {
      error.status = 500;
      throw error;
    } finally {
      this.users = {};
      this.isProcessing = false;
    }
  }

  protected emitGameStart(gameId: string): void {
    const users = Object.keys(this.users);
    const data = { users, gameId };
    entryEvents.emit('gameStart', data);
  }
}
