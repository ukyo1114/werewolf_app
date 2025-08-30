import { CurrentPhase } from '../config/types';

export default class PhaseManager {
  phaseDurations_sec = {
    pre: 30,
    day: 10 * 60,
    night: 3 * 60,
    finished: 10 * 60,
  };

  public currentDay: number = 0;
  public currentPhase: CurrentPhase = 'pre';
  public changedAt: Date;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.changedAt = new Date();
  }

  startTimer(callback: () => any): void {
    this.cancelTimer();
    const timer = this.phaseDurations_sec[this.currentPhase];
    this.timerId = setTimeout(callback, timer * 1000);
  }

  cancelTimer(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  switchPhase(phaseTo: CurrentPhase, callback: () => any): void {
    this.changedAt = new Date();
    if (phaseTo === 'day') this.currentDay = this.currentDay + 1;
    this.currentPhase = phaseTo;
    this.startTimer(callback);
  }

  // TODO: remove this
  /* nextPhase(isRunning: boolean): void {
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
    
    if (this.result.value !== 'running') {
      this.currentPhase = 'finished';
      await GameUser.endGame(this.gameId);
      return;
    }
   
  } */
}
