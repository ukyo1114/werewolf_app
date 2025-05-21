import EventEmitter from 'events';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import VoteManager from './VoteManager';
import DevineManager from './DevineManager';
import MediumManager from './MediumManager';
import GuardManager from './GuardManager';
import AttackManager from './AttackManager';
import Message from '../models/Message';
import User from '../models/User';
import Game from '../models/Game';
import GameUser from '../models/GameUser';
import { gameMaster } from '../config/messages';
import { GameResult, IGameState, IUser, IMessage } from '../config/types';
import { appState, Events } from '../app';

const { gameManagers } = appState;
const { channelEvents, gameEvents } = Events;

export default class GameManager {
  public eventEmitter: EventEmitter = new EventEmitter();
  public channelId: string;
  public gameId: string;
  public result: { value: GameResult } = { value: 'running' };
  public phaseManager: PhaseManager = new PhaseManager(
    this.eventEmitter,
    this.result,
  );
  public playerManager: PlayerManager;
  public voteManager: VoteManager;
  public devineManager: DevineManager;
  public mediumManager: MediumManager;
  public guardManager: GuardManager;
  public attackManager: AttackManager;
  public isProcessing: boolean = false;

  constructor(channelId: string, gameId: string, users: IUser[]) {
    this.channelId = channelId;
    this.gameId = gameId;
    this.playerManager = new PlayerManager(gameId, users);
    this.voteManager = new VoteManager(this.phaseManager, this.playerManager);
    this.devineManager = new DevineManager(
      this.phaseManager,
      this.playerManager,
    );
    this.mediumManager = new MediumManager(
      this.phaseManager,
      this.playerManager,
    );
    this.guardManager = new GuardManager(this.phaseManager, this.playerManager);
    this.attackManager = new AttackManager(
      this.phaseManager,
      this.playerManager,
      this.guardManager,
    );
    this.registerListners();
    // this.sendMessage();
  }

  static async createGameManager(
    channelId: string,
    users: string[],
  ): Promise<string> {
    // ゲームを作成
    const game = await Game.create({
      channelId,
      numberOfPlayers: users.length,
    });
    const gameId = game._id.toString();

    // ユーザーの詳細を取得
    const dbUsers = await User.find({ _id: { $in: users } })
      .select('_id userName')
      .lean();

    const usersDetail = dbUsers.map((user) => ({
      userId: user._id.toString(),
      userName: user.userName,
    }));

    // ゲームマネージャーを作成
    gameManagers[gameId] = new GameManager(channelId, gameId, usersDetail);

    // プレイヤーのデータをDBに保存
    const players = gameManagers[gameId].playerManager.players;
    const userList = Object.values(players).map((player) => ({
      gameId,
      userId: player.userId,
      role: player.role,
    }));
    await GameUser.insertMany(userList);

    return gameId;
  }

  static checkIsUserInGame(userId: string): boolean {
    return Object.values(gameManagers).some(
      (game) =>
        Object.keys(game.playerManager.players).includes(userId) &&
        game.result.value === 'running',
    );
  }

  static isUserPlayingGame(userId: string): string | null {
    const game = Object.values(gameManagers).find(
      (game) =>
        Object.keys(game.playerManager.players).includes(userId) &&
        game.result.value === 'running' &&
        game.playerManager.players[userId].status === 'alive',
    );

    return game ? game.gameId : null;
  }

  static getGamesByChannelId(channelId: string): GameManager[] {
    const filteredGames = Object.values(gameManagers).filter(
      (game) => game.channelId === channelId,
    );

    return filteredGames;
  }

  registerListners(): void {
    this.eventEmitter.on('timerEnd', async () => await this.handleTimerEnd());
    this.eventEmitter.on('phaseSwitched', () => this.handlePhaseSwitched());
  }

  async handleTimerEnd(): Promise<void> {
    const { currentPhase } = this.phaseManager;
    this.isProcessing = true;

    if (currentPhase === 'pre') await this.sendMessage(gameMaster.MORNING);
    if (currentPhase === 'day') await this.handleDayPhaseEnd();
    if (currentPhase === 'night') await this.handleNightPhaseEnd();
    if (currentPhase === 'finished') return this.handleGameEnd();

    this.eventEmitter.emit('processCompleted');
  }

  async handleDayPhaseEnd(): Promise<void> {
    await this.execution();
    if (this.result.value === 'villageAbandoned') return;

    await this.judgement();
    if (this.result.value === 'running') {
      await this.sendMessage(gameMaster.NIGHT);
    }
  }

  async handleNightPhaseEnd(): Promise<void> {
    const deadPlayers: string[] = [];

    const curseOccurred = this.devineManager.devine();

    const attackTarget = this.attackManager.attack();
    if (attackTarget) deadPlayers.push(attackTarget);

    if (curseOccurred) deadPlayers.push(this.curse());

    await this.sendMessage(gameMaster.ATTACK(deadPlayers));

    await this.judgement();
    if (this.result.value === 'running') {
      await this.sendMessage(gameMaster.MORNING);
    }
  }

  curse(): string {
    const { userId, userName } = this.playerManager.findPlayerByRole('fox');
    this.playerManager.kill(userId);
    this.killImmoralists();

    return userName;
  }

  async handleGameEnd(): Promise<void> {
    try {
      await Game.findByIdAndUpdate(this.gameId, { result: this.result.value });
      this.eventEmitter.removeAllListeners();

      delete gameManagers[this.gameId];
    } catch (error) {
      console.error(`Failed to end game ${this.gameId}:`, error);
    }
  }

  async execution(): Promise<void> {
    const executionTargetId = this.voteManager.getExecutionTarget();
    if (!executionTargetId) return await this.villageAbandoned();

    // 処刑を行いメッセージを送信
    const executionTarget = this.playerManager.players[executionTargetId];
    this.playerManager.kill(executionTargetId);
    await this.sendMessage(gameMaster.EXECUTION(executionTarget.userName));

    if (executionTarget.role === 'fox') this.killImmoralists();

    this.mediumManager.medium(executionTargetId);
  }

  async villageAbandoned(): Promise<void> {
    this.result.value = 'villageAbandoned';
    await this.sendMessage(gameMaster.VILLAGE_ABANDONED);
  }

  killImmoralists(): void {
    const immoralists = this.playerManager.getImmoralists();
    if (immoralists.length === 0) return;

    immoralists.forEach((immmoralist) => {
      const userId = immmoralist.userId;
      this.playerManager.kill(userId);
    });

    this.sendMessage(
      gameMaster.KILL_IMMORALIST(immoralists.map((user) => user.userName)),
    );
  }

  async judgement(): Promise<void> {
    const livingPlayers = this.playerManager.getLivingPlayers();
    const werewolves = livingPlayers.filter(
      (user) => user.role === 'werewolf',
    ).length;

    const isWerewolvesMajority = werewolves * 2 >= livingPlayers.length;
    const isFoxAlive = livingPlayers.some((user) => user.role === 'fox');

    // 勝利条件の判定
    if (isFoxAlive && (werewolves === 0 || isWerewolvesMajority)) {
      this.result.value = 'foxesWin';
      await this.sendMessage(gameMaster.FOXES_WIN);
    } else if (werewolves === 0) {
      this.result.value = 'villagersWin';
      await this.sendMessage(gameMaster.VILLAGERS_WIN);
    } else if (isWerewolvesMajority) {
      this.result.value = 'werewolvesWin';
      await this.sendMessage(gameMaster.WEREWOLVES_WIN);
    }
  }

  async sendMessage(message: string): Promise<void> {
    const newMessage = await this.createMessage(message);
    channelEvents.emit('newMessage', newMessage);
  }

  async createMessage(message: string): Promise<IMessage> {
    const newMessage = await Message.create({
      channelId: this.gameId,
      userId: '672626acf66b851cf141bd0f', // GMのid
      message,
      messageType: 'normal',
    });

    return newMessage;
  }

  handlePhaseSwitched(): void {
    this.updateGameState();
    this.isProcessing = false;
  }

  updateGameState(): void {
    const gameState = this.getGameState();
    gameEvents.emit('updateGameState', gameState);
  }

  getGameState(): IGameState {
    const { currentDay, currentPhase, changedAt } = this.phaseManager;
    const phase = { currentDay, currentPhase, changedAt };
    const gameState: IGameState = { gameId: this.gameId, phase, users: {} };

    if (currentPhase === 'finished') {
      gameState.users = this.playerManager.getPlayersWithRole();
    } else {
      gameState.users = this.playerManager.getPlayersWithoutRole();
    }

    return gameState;
  }
}
