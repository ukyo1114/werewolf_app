import { gameManagers } from '../../jest.setup';
import { EventEmitter } from 'events';
import GameManager from '../../src/classes/GameManager';
import PlayerManager from '../../src/classes/PlayerManager';
import PhaseManager from '../../src/classes/PhaseManager';
import VoteManager from '../../src/classes/VoteManager';
import DevineManager from '../../src/classes/DevineManager';
import MediumManager from '../../src/classes/MediumManager';
import GuardManager from '../../src/classes/GuardManager';
import AttackManager from '../../src/classes/AttackManager';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';

describe('test GameManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
  });

  afterAll(() => {
    delete gameManagers[mockGameId];
  });

  it('should initialize with correct properties', () => {
    expect(gameManagers[mockGameId].channelId).toBe(mockChannelId);
    expect(gameManagers[mockGameId].gameId).toBe(mockGameId);
    expect(gameManagers[mockGameId].result.value).toBe('running');
    expect(gameManagers[mockGameId].isProcessing).toBe(false);
    expect(gameManagers[mockGameId].eventEmitter).toBeInstanceOf(EventEmitter);
  });

  it('should initialize managers with correct dependencies', () => {
    expect(gameManagers[mockGameId].phaseManager).toBeInstanceOf(PhaseManager);
    expect(gameManagers[mockGameId].phaseManager.eventEmitter).toBe(
      gameManagers[mockGameId].eventEmitter,
    );
    expect(gameManagers[mockGameId].phaseManager.result).toBe(
      gameManagers[mockGameId].result,
    );

    expect(gameManagers[mockGameId].playerManager).toBeInstanceOf(
      PlayerManager,
    );
    expect(gameManagers[mockGameId].playerManager.gameId).toBe(mockGameId);
    expect(
      Object.keys(gameManagers[mockGameId].playerManager.players),
    ).toHaveLength(mockUsers.length);

    expect(gameManagers[mockGameId].voteManager).toBeInstanceOf(VoteManager);
    expect(gameManagers[mockGameId].devineManager).toBeInstanceOf(
      DevineManager,
    );
    expect(gameManagers[mockGameId].mediumManager).toBeInstanceOf(
      MediumManager,
    );
    expect(gameManagers[mockGameId].guardManager).toBeInstanceOf(GuardManager);
    expect(gameManagers[mockGameId].attackManager).toBeInstanceOf(
      AttackManager,
    );
  });

  it('should register event listeners', () => {
    const mockOn = jest.spyOn(gameManagers[mockGameId].eventEmitter, 'on');

    gameManagers[mockGameId].registerListners();

    expect(mockOn).toHaveBeenCalledWith('timerEnd', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('phaseSwitched', expect.any(Function));

    mockOn.mockRestore();
  });
});
