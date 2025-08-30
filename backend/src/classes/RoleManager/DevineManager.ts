import { Result } from '../classTypes';
import { BaseRoleManager } from './BaseRoleManager';

export default class DevineManager extends BaseRoleManager<Result> {
  // 抽象プロパティの実装
  protected readonly roleName = 'seer' as const;
  protected request: string | null = null;
  protected history: Result = {};

  devine(): string | undefined {
    const seer = this.getLivingPlayers(this.roleName);
    if (seer.length === 0) {
      this.request = null;
      return;
    }

    // 占いの対象を決める
    const currentDay = this.getCurrentDay();
    const devineTargetId = this.decideTarget();
    const devineTarget = this.playerManager.players[devineTargetId];

    // 占いの結果を抽象クラスのhistoryプロパティに記録
    this.history[currentDay] = {
      [devineTargetId]:
        devineTarget.role === 'werewolf' ? 'werewolves' : 'villagers',
    };

    return devineTarget.role === 'fox' ? devineTargetId : undefined;
  }
}
