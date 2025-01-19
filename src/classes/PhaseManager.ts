import EventEmitter from 'events';
import { Result } from './GameManager';

export type CurrentPhase = 'pre' | 'day' | 'night' | 'finished';

interface IResult {
  value: Result;
}

export default class PhaseManager {
  sec_phaseDurations = {
    pre: 30,
    day: 10 * 60,
    night: 3 * 60,
    finished: 10 * 60,
  };

  public currentDay: number = 0;
  public currentPhase: CurrentPhase = 'pre';
  public changedAt: Date;
  public result;
  public eventEmitter;

  constructor(eventEmitter: EventEmitter, result: IResult) {
    this.changedAt = new Date();
    this.result = result;
    this.eventEmitter = eventEmitter;
    this.registerListeners();
    this.startTimer();
  }

  registerListeners() {
    this.eventEmitter.on('processCompleted', () => {
      this.nextPhase();
      this.eventEmitter.emit('phaseSwitched');
      this.startTimer();
    });
  }

  startTimer() {
    const timer = this.sec_phaseDurations[this.currentPhase];
    setTimeout(() => this.eventEmitter.emit('timerEnd'), timer * 1000);
  }

  nextPhase() {
    this.changedAt = new Date();

    if (this.result.value !== 'running') {
      return (this.currentPhase = 'finished');
    }

    if (this.currentPhase === 'day') {
      this.currentPhase = 'night';
    } else {
      this.currentDay = this.currentDay + 1;
      this.currentPhase = 'day';
    }
  }
}
