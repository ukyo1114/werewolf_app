import { EventEmitter } from 'events';
import { games } from '../../src/classes/GameInstanceManager';
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
    games[mockGameId] = new GameManager(mockChannelId, mockGameId, mockUsers);
  });

  afterAll(() => {
    delete games[mockGameId];
  });

  it('should initialize with correct properties', () => {
    expect(games[mockGameId].channelId).toBe(mockChannelId);
    expect(games[mockGameId].gameId).toBe(mockGameId);
    expect(games[mockGameId].result.value).toBe('running');
    expect(games[mockGameId].isProcessing).toBe(false);
    expect(games[mockGameId].eventEmitter).toBeInstanceOf(EventEmitter);
  });

  it('should initialize managers with correct dependencies', () => {
    expect(games[mockGameId].phaseManager).toBeInstanceOf(PhaseManager);
    expect(games[mockGameId].phaseManager.eventEmitter).toBe(
      games[mockGameId].eventEmitter,
    );
    expect(games[mockGameId].phaseManager.result).toBe(
      games[mockGameId].result,
    );

    expect(games[mockGameId].playerManager).toBeInstanceOf(PlayerManager);
    expect(games[mockGameId].playerManager.gameId).toBe(mockGameId);
    expect(Object.keys(games[mockGameId].playerManager.players)).toHaveLength(
      mockUsers.length,
    );

    expect(games[mockGameId].voteManager).toBeInstanceOf(VoteManager);
    expect(games[mockGameId].devineManager).toBeInstanceOf(DevineManager);
    expect(games[mockGameId].mediumManager).toBeInstanceOf(MediumManager);
    expect(games[mockGameId].guardManager).toBeInstanceOf(GuardManager);
    expect(games[mockGameId].attackManager).toBeInstanceOf(AttackManager);
  });

  it('should register event listeners', () => {
    const mockOn = jest.spyOn(games[mockGameId].eventEmitter, 'on');

    games[mockGameId].registerListners();

    expect(mockOn).toHaveBeenCalledWith('timerEnd', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('phaseSwitched', expect.any(Function));

    mockOn.mockRestore();
  });
});
