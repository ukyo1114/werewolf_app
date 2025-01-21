import EventEmitter from 'events';
import { Result } from './GameManager';

export type CurrentPhase = 'pre' | 'day' | 'night' | 'finished';

interface IResult {
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

  registerListner() {
    this.eventEmitter.on('processCompleted', () => {
      this.nextPhase();
      this.eventEmitter.emit('phaseSwitched');
      this.startTimer();
    });
  }

  startTimer() {
    const timer = this.phaseDurations_sec[this.currentPhase];
    this.timerId = setTimeout(
      () => this.eventEmitter.emit('timerEnd'),
      timer * 1000,
    );
  }

  nextPhase() {
    this.changedAt = new Date();

    if (this.currentPhase === 'finished') {
      return console.error(
        'フェーズが既に終了しているため、次のフェーズに進むことはできません。',
      );
    }

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
