import { History } from '../classTypes';
import { BaseRoleManager } from './BaseRoleManager';

export default class GuardManager extends BaseRoleManager<History> {
  // 抽象プロパティの実装
  protected readonly roleName = 'hunter' as const;
  protected request: string | null = null;
  protected history: History = {};

  protected decideTarget(): string {
    const targetId = super.decideTarget();
    const currentDay = this.getCurrentDay();
    this.history[currentDay] = targetId;
    return targetId;
  }

  guard(): string | undefined {
    const hunter = this.getLivingPlayers(this.roleName);
    if (hunter.length === 0) return;

    return this.decideTarget();
  }
}
