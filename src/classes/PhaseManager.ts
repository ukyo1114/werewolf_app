import EventEmitter from 'events';
import { Result } from './GameManager';

export type CurrentPhase = 'pre' | 'day' | 'night' | 'finished';

export interface IResult {
  value: Result;
}

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
  public result;
  public eventEmitter;
  public timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(eventEmitter: EventEmitter, result: IResult) {
    this.changedAt = new Date();
    this.result = result;
    this.eventEmitter = eventEmitter;
    this.registerListner();
    this.startTimer();
  }

  registerListner(): void {
    // TODO: エラーハンドリング追加
    this.eventEmitter.on('processCompleted', () => {
      this.nextPhase();
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

  nextPhase(): void {
    const currentPhase = this.currentPhase;
    this.changedAt = new Date();

    if (currentPhase === 'finished') throw new Error();

    if (this.result.value !== 'running') {
      this.currentPhase = 'finished';
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
