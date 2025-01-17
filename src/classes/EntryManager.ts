import Game from '../models/gameModel';

export default class EntryManager {
  public channelId: string;
  public users: {
    [key: string]: { socketId: string };
  } = {};
  public MAX_USERS: number;
  public isProcessing: boolean;

  constructor(channelId: string, max_users: number) {
    this.channelId = channelId;
    this.MAX_USERS = max_users;
    this.isProcessing = false;
  }

  register(userId: string, socketId: string) {
    if (this.isProcessing) return; // TODO: エラーを返す

    this.users[userId] = { socketId };

    if (Object.keys(this.users).length === this.MAX_USERS) {
      this.isProcessing = true;
      // await this.startGame();
    }

    // this.entryUpdate();
  }

  cancel(userId: string) {
    if (this.isProcessing) return; // TODO: エラーを返す

    delete this.users[userId];
    // this.entryUpdate();
  }

  getUserList(): string[] {
    return Object.keys(this.users);
  }

  entryUpdate() {
    const userList = this.getUserList();

    /*     entryEvents.emit('entryUpdate', {
      channelId: this.channelId,
      userList,
    }); */
  }

  /*   async startGame() {
    try {
      const { _id: gameId } = await Game.create({
        channelId: this.channelId,
        numberOfPlayers: this.MAX_USERS,
      });

      const newGame = await Game.findById(gameId)
        .select('_id users channel')
        .populate('users', '_id name');

      GameState.createGame(newGame);

      entryEvents.emit('gameStart', {
        socketIds: this.users.map((user) => user.socketId),
        gameId,
      });
    } catch (error) {
      console.error('error:', error.message);
      // entryEvents.emit("gameCreationFailed", { channelId: this.channelId });
    } finally {
      // カウンターをリセット
      this.users = {};
      this.isProcessing = false;
    }
  } */
}
