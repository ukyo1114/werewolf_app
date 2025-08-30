import { Result } from '../classTypes';
import { BaseRoleManager } from './BaseRoleManager';

export default class MediumManager extends BaseRoleManager<Result> {
  // 抽象プロパティの実装
  protected readonly roleName = 'medium' as const;
  protected request: string | null = null;
  protected history: Result = {};

  medium(targetId: string): void {
    const medium = this.getLivingPlayers(this.roleName);
    if (medium.length === 0) return;

    const target = this.playerManager.players[targetId];
    const currentDay = this.getCurrentDay();

    this.history[currentDay] = {
      [targetId]: target.role !== 'werewolf' ? 'villagers' : 'werewolves',
    };
  }
}
