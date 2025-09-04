import EventEmitter from 'events';
import PhaseManager from './PhaseManager';
import PlayerManager from './PlayerManager';
import VoteManager from './VoteManager';
import {
  DevineManager,
  MediumManager,
  GuardManager,
  AttackManager,
} from './RoleManager';
import GameChannelManager from './GameChannelManager';
import Messages from '../models/Messages';
import Users, { IUser } from '../models/Users';
import Games from '../models/Games';
import GameUsers from '../models/GameUsers';
import { gameMaster } from '../config/messages';
import { GameResult, IGameState, IPlayer } from './classTypes';
import { appState, Events } from '../config/appState';
import { IMessageIndex } from '../config/types';

const { channelManagers, gameManagers } = appState;
const { channelEvents, gameEvents } = Events;

export default class GameManager {
  protected gameMaster: string = process.env.GAME_MASTER_ID || '';
  public channelId: string;
  public gameId: string;
  public result: { value: GameResult } = { value: 'running' };
  public isProcessing: boolean = false;
  public phaseManager: PhaseManager;
  public playerManager: PlayerManager;
  public voteManager: VoteManager;
  public devineManager: DevineManager;
  public mediumManager: MediumManager;
  public guardManager: GuardManager;
  public attackManager: AttackManager;

  constructor(
    channelId: string,
    gameId: string,
    users: { userId: string; userName: string }[],
  ) {
    this.channelId = channelId;
    this.gameId = gameId;
    this.phaseManager = new PhaseManager();
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
  }

  static async createGame(channelId: string, users: string[]): Promise<string> {
    let gameId: string | undefined;

    try {
      const numberOfPlayers = users.length;
      const game = await Games.create({ channelId, numberOfPlayers });
      gameId = game._id.toString();

      const dbUsers = await Users.getUsersForGame(users);
      const gameManager = this.createGameManager(channelId, gameId, dbUsers);
      channelManagers[gameId] = new GameChannelManager(gameId, gameManager);

      await this.registerPlayersToDB(gameId, dbUsers, gameManager);

      return gameId;
    } catch (error) {
      if (gameId) delete gameManagers[gameId];
      throw error;
    }
  }

  static createGameManager(
    channelId: string,
    gameId: string,
    users: IUser[],
  ): GameManager {
    const formattedUsers = users.map((user) => ({
      userId: user._id.toString(),
      userName: user.userName,
    }));
    return (gameManagers[gameId] = new GameManager(
      channelId,
      gameId,
      formattedUsers,
    ));
  }

  static async registerPlayersToDB(
    gameId: string,
    players: IUser[],
    gameManager: GameManager,
  ): Promise<void> {
    const userRoleMap = gameManager.playerManager.getUserRoleMap();
    const playerData = players.map((player) => {
      const userId = player._id.toString();
      return {
        gameId,
        userId,
        userName: player.userName,
        pic: player.pic,
        role: userRoleMap[userId],
        isPlaying: true,
      };
    });
    await GameUsers.insertMany(playerData);
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

  protected handleGameProcess(): void {
    if (this.result.value !== 'running') return;

    const { currentPhase } = this.phaseManager;
    if (currentPhase === 'day') {
      this.phaseManager.switchPhase('night', async () => {
        await this.handleNightPhaseEnd();
        this.handleGameProcess();
      });
    } else {
      this.phaseManager.switchPhase('day', async () => {
        await this.handleDayPhaseEnd();
        this.handleGameProcess();
      });
    }
  }

  protected startPrePhase(): void {
    this.phaseManager.switchPhase('pre', () => {
      this.handleGameProcess();
    });
  }

  protected async handleDayPhaseEnd(): Promise<void> {
    this.isProcessing = true;
    await this.dayProcess();
    this.isProcessing = false;
    if (this.result.value !== 'running') return;

    await this.sendMessage(gameMaster.NIGHT);
  }

  protected async handleNightPhaseEnd(): Promise<void> {
    this.isProcessing = true;
    await this.nightProcess();
    this.isProcessing = false;
    if (this.result.value !== 'running') return;

    await this.sendMessage(gameMaster.MORNING);
  }

  protected async dayProcess(): Promise<void> {
    const targetId = await this.execution();
    if (!targetId || this.result.value !== 'running') return;

    this.mediumManager.medium(targetId);
  }

  protected async nightProcess(): Promise<void> {
    const curseId = this.devineManager.devine();
    const attackId = await this.attack();

    if (this.result.value !== 'running') return;

    const deadPlayers = [];
    if (curseId) deadPlayers.push(curseId);
    if (attackId) deadPlayers.push(attackId);
    await this.notifyAttack(deadPlayers);

    if (curseId) await this.killFox(curseId);
  }

  protected async killFox(userId: string): Promise<void> {
    await this.playerManager.kill(userId);
    await this.handleJudgement();
    if (this.result.value !== 'running') return;
    await this.suicide();
  }

  protected async attack(): Promise<string | undefined> {
    const attackTargetId = this.attackManager.attack();
    const guardTargetId = this.guardManager.guard();

    if (attackTargetId && attackTargetId !== guardTargetId) {
      await this.playerManager.kill(attackTargetId);
      await this.handleJudgement(async () => {
        await this.notifyAttack([attackTargetId]);
      });
      return attackTargetId;
    }
  }

  protected async notifyAttack(deadPlayers: string[]): Promise<void> {
    const nameList = deadPlayers.map(
      (id) => this.playerManager.players[id].userName,
    );
    await this.sendMessage(gameMaster.ATTACK(nameList));
  }

  protected async execution(): Promise<string | undefined> {
    const targetId = this.voteManager.getExecutionTarget();
    if (!targetId) {
      await this.villageAbandoned();
      return;
    }

    const target = this.playerManager.players[targetId];
    await this.sendMessage(gameMaster.EXECUTION(target.userName));

    if (target.role === 'fox') {
      await this.killFox(targetId);
    } else {
      await this.kill(targetId);
    }

    return targetId;
  }

  protected async kill(userId: string): Promise<void> {
    await this.playerManager.kill(userId);
    await this.handleJudgement();
  }

  protected async suicide(): Promise<void> {
    const immoralists = this.playerManager.getLivingPlayers('immoralist');
    if (immoralists.length === 0) return;

    const nameList = immoralists.map((user) => user.userName);
    await this.sendMessage(gameMaster.KILL_IMMORALIST(nameList));

    const idList = immoralists.map((user) => user.userId);
    await Promise.all(idList.map((id) => this.playerManager.kill(id)));

    await this.handleJudgement();
  }

  protected async villageAbandoned(): Promise<void> {
    this.result.value = 'villageAbandoned';
    this.handleGameEnd('villageAbandoned');
  }

  protected async handleJudgement(onGameEnd?: () => any): Promise<void> {
    const result = await this.judgement();
    if (result === 'running') return;
    if (onGameEnd) onGameEnd();

    this.handleGameEnd(result);
  }

  protected async judgement(): Promise<GameResult> {
    const players = this.playerManager.getLivingPlayers();
    const werewolves = this.playerManager.getLivingPlayers('werewolf');
    const foxes = this.playerManager.getLivingPlayers('fox');

    const isWerewolvesExtinct = werewolves.length === 0;
    const isWerewolvesMajority = werewolves.length * 2 >= players.length;
    if (!isWerewolvesExtinct && !isWerewolvesMajority) return 'running';
    const isFoxAlive = foxes.length > 0;

    const result = isFoxAlive
      ? 'foxesWin'
      : isWerewolvesExtinct
        ? 'villagersWin'
        : 'werewolvesWin';
    return (this.result.value = result);
  }

  protected async announceResult(result: GameResult): Promise<void> {
    this.result.value = result;
    const resultMap = {
      running: '',
      foxesWin: gameMaster.FOXES_WIN,
      villagersWin: gameMaster.VILLAGERS_WIN,
      werewolvesWin: gameMaster.WEREWOLVES_WIN,
      villageAbandoned: gameMaster.VILLAGE_ABANDONED,
    };
    await this.sendMessage(resultMap[result]);
  }

  protected async handleGameEnd(result: GameResult): Promise<void> {
    await this.announceResult(result);
    await this.recordResultToDB(result);

    this.notifyGameState();
    this.switchPhaseToFinished();
  }

  protected async recordResultToDB(result: GameResult): Promise<void> {
    try {
      await Promise.all([
        Games.endGame(this.gameId, result),
        GameUsers.endGame(this.gameId),
      ]);
    } catch (error) {
      console.error(`Failed to end game ${this.gameId}:`, error);
    }
  }

  protected switchPhaseToFinished(): void {
    this.phaseManager.switchPhase('finished', () => {
      delete channelManagers[this.gameId];
      delete gameManagers[this.gameId];
    });
  }

  protected notifyGameState(): void {
    const gameState = this.getGameState();
    gameEvents.emit('updateGameState', gameState);
  }

  getGameState(): IGameState {
    const { currentDay, currentPhase, changedAt } = this.phaseManager;
    const gameState = {
      gameId: this.gameId,
      currentDay,
      currentPhase,
      changedAt,
    };

    const withRole = currentPhase === 'finished';
    const users = this.playerManager.getPlayersInfo(withRole);

    return { ...gameState, users };
  }

  protected async sendMessage(message: string): Promise<void> {
    try {
      const newMessage = await Messages.create({
        channelId: this.gameId,
        userId: this.gameMaster,
        message,
        messageType: 'system',
      });
      const index = {
        _id: newMessage._id,
        createdAt: newMessage.createdAt,
      } as IMessageIndex;

      channelEvents.emit('newMessage', this.gameId, [index]);
    } catch (error) {
      console.error(`Failed to send message ${this.gameId}:`, error);
    }
  }
}
