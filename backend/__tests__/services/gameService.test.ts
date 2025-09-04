// モックの設定
jest.mock('../../src/models/Games');
jest.mock('../../src/models/GameUsers');
jest.mock('../../src/models/Users');
jest.mock('../../src/models/ChannelUsers');
jest.mock('../../src/classes/GameManager');
jest.mock('../../src/config/appState', () => ({
  appState: {
    gameManagers: {
      mockGameId: {
        isProcessing: false,
        phaseManager: {
          currentDay: 1,
          currentPhase: 'day',
        },
        result: { value: 'ongoing' },
      },
    },
  },
  Events: {
    channelEvents: {
      emit: jest.fn(),
    },
  },
}));

import mongoose from 'mongoose';
import { GameService } from '../../src/services/game/services';
import Games from '../../src/models/Games';
import GameUsers from '../../src/models/GameUsers';
import Users from '../../src/models/Users';
import ChannelUsers from '../../src/models/ChannelUsers';
import GameManager from '../../src/classes/GameManager';
import { appState } from '../../src/config/appState';

describe('GameService', () => {
  let gameService: GameService;
  const mockGameId = 'mockGameId';
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockChannelId = 'mockChannelId';

  beforeEach(() => {
    gameService = new GameService();
    jest.clearAllMocks();
  });

  describe('joinGame', () => {
    it('ゲームに正常に参加する', async () => {
      const mockGameInfo = {
        channelId: mockChannelId,
        channelName: 'Test Game',
        channelDescription: 'Test Description',
      };
      const mockGameUsers = [{ userId: mockUserId, userName: 'TestUser' }];

      (Games.getGameInfo as jest.Mock).mockResolvedValue(mockGameInfo);
      (ChannelUsers.isUserInChannel as jest.Mock).mockResolvedValue(true);
      (GameUsers.joinGame as jest.Mock).mockResolvedValue(undefined);
      (GameUsers.getGameUsers as jest.Mock).mockResolvedValue(mockGameUsers);
      (Users.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: mockUserId,
            userName: 'TestUser',
            pic: 'pic.jpg',
            isGuest: false,
          }),
        }),
      });

      const result = await gameService.joinGame(mockGameId, mockUserId);

      expect(result).toEqual({
        channelId: mockChannelId,
        channelName: 'Test Game',
        channelDescription: 'Test Description',
        gameUsers: mockGameUsers,
      });
      expect(Games.getGameInfo).toHaveBeenCalledWith(mockGameId);
      expect(GameUsers.joinGame).toHaveBeenCalledWith(mockGameId, mockUserId);
      expect(GameUsers.getGameUsers).toHaveBeenCalledWith(mockGameId);
    });
  });

  describe('getGameList', () => {
    it('ゲームリストを正常に取得する', async () => {
      const mockGameList = [
        {
          gameId: mockGameId,
          players: [{ userId: mockUserId, userName: 'TestUser' }],
          currentDay: 1,
          currentPhase: 'day',
          result: 'running',
        },
      ];

      (ChannelUsers.checkUserInChannel as jest.Mock).mockResolvedValue(
        undefined,
      );
      (GameManager.getGamesByChannelId as jest.Mock).mockReturnValue([
        {
          gameId: mockGameId,
          result: { value: 'running' },
          phaseManager: { currentDay: 1, currentPhase: 'day' },
        },
      ]);
      (GameUsers.getGamePlayers as jest.Mock).mockResolvedValue([
        { userId: mockUserId, userName: 'TestUser' },
      ]);

      const result = await gameService.getGameList(mockUserId, mockChannelId);

      expect(result).toEqual(mockGameList);
      expect(ChannelUsers.checkUserInChannel).toHaveBeenCalledWith(
        mockChannelId,
        mockUserId,
      );
    });
  });

  describe('handleGameAction', () => {
    it('ゲームアクションを正常に処理する', async () => {
      const mockAction = 'vote';
      const mockSelectedUser = 'selectedUserId';
      const mockResult = { success: true };

      // GameManagerのモックを設定
      const mockGameManager = {
        isProcessing: false,
        voteManager: {
          receiveVote: jest.fn().mockReturnValue(mockResult),
        },
      };

      // appStateのモックを更新
      appState.gameManagers[mockGameId] = mockGameManager as any;
      (GameUsers.exists as jest.Mock).mockResolvedValue(true);

      const result = await gameService.handleGameAction(
        mockGameId,
        mockUserId,
        mockAction,
        mockSelectedUser,
      );

      expect(result).toEqual(mockResult);
      expect(GameUsers.exists).toHaveBeenCalledWith({
        gameId: mockGameId,
        userId: mockUserId,
      });
    });
  });
});
