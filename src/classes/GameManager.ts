import EventEmitter from 'events';
import { games } from './GameInstanceManager';
import PhaseManager, { CurrentPhase } from './PhaseManager';
import PlayerManager, { Status, IUser } from './PlayerManager';
import VoteManager from './VoteManager';
import DevineManager from './DevineManager';
import MediumManager from './MediumManager';
import GuardManager from './GuardManager';
import AttackManager from './AttackManager';
import Message, { IMessage } from '../models/messageModel';
import Game from '../models/gameModel';
import { gameMaster } from '../config/messages';
import { Role } from '../config/roles';

export type Result =
  | 'running'
  | 'villagersWin'
  | 'werewolvesWin'
  | 'foxesWin'
  | 'villageAbandoned';

interface IGameState {
  gameId: string;
  phase: {
    currentDay: number;
    currentPhase: CurrentPhase;
    changedAt: Date;
  };
  users: {
    [key: string]: {
      userId: string;
      status: Status;
      role?: Role;
    };
  };
}

export default class GameManager {
  public eventEmitter: EventEmitter = new EventEmitter();
  public channelId: string;
  public gameId: string;
  public result: { value: Result } = { value: 'running' };
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

  registerListners() {
    this.eventEmitter.on('timerEnd', async () => await this.handleTimerEnd());
    this.eventEmitter.on('phaseSwitched', () => this.handlePhaseSwitched());
  }

  async handleTimerEnd() {
    const { currentPhase } = this.phaseManager;
    this.isProcessing = true;

    if (currentPhase === 'pre') await this.sendMessage(gameMaster.MORNING);
    if (currentPhase === 'day') await this.handleDayPhaseEnd();
    if (currentPhase === 'night') await this.handleNightPhaseEnd();
    if (currentPhase === 'finished') return this.handleGameEnd();

    this.eventEmitter.emit('processCompleted');
  }

  async handleDayPhaseEnd() {
    await this.execution();

    if (this.result.value === 'villageAbandoned') return;

    await this.judgement();

    if (this.result.value === 'running') {
      await this.sendMessage(gameMaster.NIGHT);
    }
  }

  async handleNightPhaseEnd() {
    const deadPlayers: string[] = [];
    const seer = this.playerManager.findPlayerByRole('seer');
    let devinedFoxId: string | null = null;

    // 占い
    if (seer?.status === 'alive') {
      const devineTargetId = this.devineManager.devine();
      const devineTarget = this.playerManager.players[devineTargetId];

      // 狐を占ったとき
      if (devineTarget.role === 'fox') {
        devinedFoxId = devineTargetId;
        deadPlayers.push(devineTarget.userName);
      }
    }

    // 襲撃（ランダムの場合、狐も対象に含む）
    const attackTargetId = this.attackManager.attack();
    if (attackTargetId) {
      const attackTarget = this.playerManager.players[attackTargetId];
      deadPlayers.push(attackTarget.userName);
    }

    // 呪殺と後追い
    if (devinedFoxId) {
      this.playerManager.kill(devinedFoxId);
      this.killImmoralists();
    }

    await this.sendMessage(gameMaster.ATTACK(deadPlayers));

    await this.judgement();

    if (this.result.value === 'running') {
      await this.sendMessage(gameMaster.MORNING);
    }
  }

  async handleGameEnd() {
    try {
      await Game.findByIdAndUpdate(this.gameId, { result: this.result.value });
      this.eventEmitter.removeAllListeners();

      delete games[this.gameId];
    } catch (error) {
      console.error(`Failed to end game ${this.gameId}:`, error);
    }
  }

  async execution() {
    const executionTargetId = this.voteManager.getExecutionTarget();

    if (!executionTargetId) return await this.villageAbandoned();

    const executionTarget = this.playerManager.players[executionTargetId];

    this.playerManager.kill(executionTargetId);
    await this.sendMessage(gameMaster.EXECUTION(executionTarget.userName));

    if (executionTarget.role === 'fox') this.killImmoralists();

    const medium = this.playerManager.findPlayerByRole('medium');
    if (medium?.status === 'alive') {
      this.mediumManager.medium(executionTargetId);
    }
  }

  async villageAbandoned() {
    this.result.value = 'villageAbandoned';
    await this.sendMessage(gameMaster.VILLAGE_ABANDONED);
  }

  killImmoralists(): string[] | undefined {
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

  async judgement() {
    const livingPlayers = this.playerManager.getLivingPlayers();

    // 役職ごとに集計
    const villagers = livingPlayers.filter(
      (user) => user.role !== 'werewolf',
    ).length;
    const werewolves = livingPlayers.filter(
      (user) => user.role === 'werewolf',
    ).length;
    const isFoxAlive = livingPlayers.some((user) => user.role === 'fox');

    // 勝利条件の判定
    if (isFoxAlive && (werewolves === 0 || werewolves >= villagers)) {
      this.result.value = 'foxesWin';
      await this.sendMessage(gameMaster.FOXES_WIN);
    } else if (werewolves === 0) {
      this.result.value = 'villagersWin';
      await this.sendMessage(gameMaster.VILLAGERS_WIN);
    } else if (werewolves >= villagers) {
      this.result.value = 'werewolvesWin';
      await this.sendMessage(gameMaster.WEREWOLVES_WIN);
    }
  }

  async sendMessage(message: string) {
    const newMessage: IMessage = await this.createMessage(message);

    // channelEvents.emit("newMessage", newMessage);
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

  handlePhaseSwitched() {
    this.updateGameState();
    this.isProcessing = false;
  }

  updateGameState() {
    const gameState = this.getGameState();
    // gameEvents.emit("updateGameState", gameState);
  }

  getGameState() {
    const { currentDay, currentPhase, changedAt } = this.phaseManager;
    const phase = { currentDay, currentPhase, changedAt };
    const gameState: IGameState = { gameId: this.gameId, phase, users: {} };

    let users;
    if (currentPhase === 'finished') {
      gameState.users = this.playerManager.getPlayersWithRole();
    } else {
      gameState.users = this.playerManager.getPlayersWithoutRole();
    }

    return { gameId: this.gameId, users, phase };
  }
}
