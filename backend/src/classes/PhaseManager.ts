import EventEmitter from 'events';
import { IGameResult, CurrentPhase } from '../config/types';
import GameUser from '../models/GameUser';

export default class PhaseManager {
  phaseDurations_sec = {
    pre: 30,
    day: 10 * 60,
    night: 3 * 60,
    finished: 10 * 60,
  };

  public gameId: string;
  public currentDay: number = 0;
  public currentPhase: CurrentPhase = 'pre';
  public changedAt: Date;
  public timerId: ReturnType<typeof setTimeout> | null = null;
  public result: IGameResult;
  public eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter, result: IGameResult, gameId: string) {
    this.changedAt = new Date();
    this.result = result;
    this.eventEmitter = eventEmitter;
    this.gameId = gameId;
    this.registerListner();
    this.startTimer();
  }

  registerListner(): void {
    this.eventEmitter.on('processCompleted', async () => {
      await this.nextPhase();
      this.eventEmitter.emit('phaseSwitched');
      this.startTimer();
    });
  }

  startTimer(): void {
    const timer = this.phaseDurations_sec[this.currentPhase];
    this.timerId = setTimeout(
      () => this.eventEmitter.emit('timerEnd'),
      timer * 1000,
    );
  }

  async nextPhase(): Promise<void> {
    const currentPhase = this.currentPhase;
    this.changedAt = new Date();

    if (currentPhase === 'finished') return;

    if (this.result.value !== 'running') {
      this.currentPhase = 'finished';
      await GameUser.endGame(this.gameId);
      return;
    }

    if (currentPhase === 'day') {
      this.currentPhase = 'night';
    } else {
      this.currentDay = this.currentDay + 1;
      this.currentPhase = 'day';
    }
  }
}
