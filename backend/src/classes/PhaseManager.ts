import EventEmitter from 'events';
import { CurrentPhase } from '../config/types';

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
  public eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter, gameId: string) {
    this.changedAt = new Date();
    this.eventEmitter = eventEmitter;
    this.gameId = gameId;
    this.registerListner();
    this.startTimer();
  }

  registerListner(): void {
    this.eventEmitter.on('processCompleted', async (isRunning: boolean) => {
      await this.nextPhase(isRunning);
      this.eventEmitter.emit('phaseSwitched');
    });
  }

  startTimer(): void {
    const timer = this.phaseDurations_sec[this.currentPhase];
    this.timerId = setTimeout(
      () => this.eventEmitter.emit('timerEnd'),
      timer * 1000,
    );
  }

  async nextPhase(isRunning: boolean): Promise<void> {
    const currentPhase = this.currentPhase;
    this.changedAt = new Date();

    if (currentPhase === 'finished') return;
    if (!isRunning) {
      this.currentPhase = 'finished';
    } else if (currentPhase === 'day') {
      this.currentPhase = 'night';
    } else {
      this.currentDay = this.currentDay + 1;
      this.currentPhase = 'day';
    }
    this.startTimer();
    /* 
    if (this.result.value !== 'running') {
      this.currentPhase = 'finished';
      await GameUser.endGame(this.gameId);
      return;
    }
    */
  }
}
