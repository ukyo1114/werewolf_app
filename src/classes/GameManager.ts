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
import { GameResult, IGameState, IUser } from '../config/types';
import { appState, Events } from '../app';

const { gameManagers } = appState;
const { channelEvents, gameEvents } = Events;

export default class GameManager {
  public channelId: string;
  public gameId: string;
  public result: { value: GameResult } = { value: 'running' };
  public isProcessing: boolean = false;
  public eventEmitter: EventEmitter = new EventEmitter();
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public voteManager: VoteManager;
  public devineManager: DevineManager;
  public mediumManager: MediumManager;
  public guardManager: GuardManager;
  public attackManager: AttackManager;

  constructor(channelId: string, gameId: string, users: IUser[]) {
    this.channelId = channelId;
    this.gameId = gameId;
    this.phaseManager = new PhaseManager(
      this.eventEmitter,
      this.result,
      this.gameId,
    );
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
    );
    this.registerListners();
    // this.sendMessage();
  }

  static async createGameManager(
    channelId: string,
    users: string[],
  ): Promise<string> {
    let gameId: string | undefined;

    try {
      // ゲームを作成
      const game = await Game.create({
        channelId,
        numberOfPlayers: users.length,
      });
      gameId = game._id.toString();

      // ユーザーの詳細を取得
      const dbUsers = await User.find({ _id: { $in: users } })
        .select('_id userName')
        .lean();
      if (dbUsers.length !== users.length) {
        throw new Error();
      }

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
        isPlaying: true,
      }));
      await GameUser.insertMany(userList);

      return gameId;
    } catch (error) {
      if (gameId) {
        await Game.findByIdAndDelete(gameId);
        const timerId = gameManagers[gameId]?.phaseManager.timerId;
        if (timerId) clearTimeout(timerId);
        delete gameManagers[gameId];
      }
      throw error;
    }
  }

  static checkIsUserInGame(userId: string): boolean {
    return Object.values(gameManagers).some(
      (game) =>
        Object.keys(game.playerManager.players).includes(userId) &&
        game.result.value === 'running',
    );
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
    this.isProcessing = true;
    const { currentPhase } = this.phaseManager;

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

    const guardTargetId = this.guardManager.guard();
    const attackTarget = await this.attackManager.attack(guardTargetId);
    if (attackTarget) deadPlayers.push(attackTarget);

    if (curseOccurred) {
      const curseResult = await this.curse();
      if (curseResult) deadPlayers.push(curseResult);
    }

    await this.sendMessage(gameMaster.ATTACK(deadPlayers));

    await this.judgement();
    if (this.result.value === 'running') {
      await this.sendMessage(gameMaster.MORNING);
    }
  }

  async execution(): Promise<void> {
    const executionTargetId = this.voteManager.getExecutionTarget();
    if (!executionTargetId) {
      await this.villageAbandoned();
      return;
    }

    // 処刑を行いメッセージを送信
    const executionTarget = this.playerManager.players[executionTargetId];
    await this.playerManager.kill(executionTargetId);
    await this.sendMessage(gameMaster.EXECUTION(executionTarget.userName));

    if (executionTarget.role === 'fox') await this.suicide();

    this.mediumManager.medium(executionTargetId);
  }

  async curse(): Promise<string | undefined> {
    const fox = this.playerManager.getLivingPlayers('fox')[0];
    if (!fox) return;
    await this.playerManager.kill(fox.userId);

    await this.suicide();

    return fox.userName;
  }

  async suicide(): Promise<void> {
    const immoralists = this.playerManager.getLivingPlayers('immoralist');
    if (immoralists.length > 0) {
      await Promise.all(
        immoralists.map((immor) => this.playerManager.kill(immor.userId)),
      );
      await this.sendMessage(
        gameMaster.KILL_IMMORALIST(immoralists.map((user) => user.userName)),
      );
    }
  }

  async villageAbandoned(): Promise<void> {
    this.result.value = 'villageAbandoned';
    await this.sendMessage(gameMaster.VILLAGE_ABANDONED);
  }

  async judgement(): Promise<void> {
    const livingPlayers = this.playerManager.getLivingPlayers();
    const werewolves = livingPlayers.filter(
      (user) => user.role === 'werewolf',
    ).length;

    const isWerewolvesExtinct = werewolves === 0;
    const isWerewolvesMajority = werewolves * 2 >= livingPlayers.length;
    const isFoxAlive = livingPlayers.some((user) => user.role === 'fox');

    if (isWerewolvesExtinct || isWerewolvesMajority) {
      if (isFoxAlive) {
        this.result.value = 'foxesWin';
        await this.sendMessage(gameMaster.FOXES_WIN);
      } else if (isWerewolvesExtinct) {
        this.result.value = 'villagersWin';
        await this.sendMessage(gameMaster.VILLAGERS_WIN);
      } else if (isWerewolvesMajority) {
        this.result.value = 'werewolvesWin';
        await this.sendMessage(gameMaster.WEREWOLVES_WIN);
      }
    }
  }

  async sendMessage(message: string): Promise<void> {
    try {
      const newMessage = await Message.create({
        channelId: this.gameId,
        userId: '672626acf66b851cf141bd0f', // GMのid
        message,
        messageType: 'system',
      });

      channelEvents.emit('newMessage', this.gameId, newMessage, null);
    } catch (error) {
      console.error(`Failed to send message ${this.gameId}:`, error);
    }
  }

  async handleGameEnd(): Promise<void> {
    try {
      await Game.endGame(this.gameId, this.result.value);
    } catch (error) {
      console.error(`Failed to end game ${this.gameId}:`, error);
    } finally {
      this.eventEmitter.removeAllListeners();
      const timerId = this.phaseManager.timerId;
      if (timerId) clearTimeout(timerId);
      delete gameManagers[this.gameId];
    }
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
      gameState.users = this.playerManager.getPlayersInfo(true);
    } else {
      gameState.users = this.playerManager.getPlayersInfo(false);
    }

    return gameState;
  }
}
