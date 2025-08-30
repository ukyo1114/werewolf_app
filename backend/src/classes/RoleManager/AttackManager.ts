import { History } from '../classTypes';
import { BaseRoleManager } from './BaseRoleManager';

export default class AttackManager extends BaseRoleManager<History> {
  protected readonly roleName = 'werewolf' as const;
  protected request: string | null = null;
  protected history: History = {};

  protected decideTarget(): string {
    const targetId = super.decideTarget();
    const currentDay = this.getCurrentDay();
    this.history[currentDay] = targetId;
    return targetId;
  }

  attack(): string | undefined {
    const targetId = this.decideTarget();
    if (this.isTargetFox(targetId)) return;

    return targetId;
  }

  protected isTargetFox(targetId: string): boolean {
    const target = this.playerManager.players[targetId];
    return target.role === 'fox';
  }
}
