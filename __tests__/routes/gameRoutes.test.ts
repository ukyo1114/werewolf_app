import app, { appState, Events } from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/User';
import Channel from '../../src/models/Channel';
import Game from '../../src/models/Game';
import ChannelUser from '../../src/models/ChannelUser';
import {
  mockChannelId,
  mockUserId,
  mockGameId,
  mockUsers,
} from '../../__mocks__/mockdata';
import GameUser from '../../src/models/GameUser';
import { ObjectId } from 'mongodb';
import GameManager from '../../src/classes/GameManager';
import { errors, validation } from '../../src/config/messages';
import { genUserToken } from '../../src/utils/generateToken';

describe('test gameRoutes', () => {
  const { gameManagers } = appState;
  const { channelEvents } = Events;
  const testUserId = new ObjectId().toString();
  const testUser2Id = new ObjectId().toString();
  const testChannelId = new ObjectId().toString();
  const testGameId = new ObjectId().toString();
  const emitSpy = jest.spyOn(channelEvents, 'emit');

  beforeAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      GameUser.deleteMany({}),
      ChannelUser.deleteMany({}),
      Channel.deleteMany({}),
      Game.deleteMany({}),
    ]);
    await Promise.all([
      User.create({
        _id: testUserId,
        userName: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
      User.create({
        _id: testUser2Id,
        userName: 'testUser2',
        email: 'test2@example.com',
        password: 'password123',
        pic: null,
        isGuest: false,
      }),
      await Channel.create({
        _id: testChannelId,
        channelName: 'testChannel',
        channelDescription: 'testDescription',
        channelAdmin: testUserId,
      }),
      await ChannelUser.create({
        channelId: testChannelId,
        userId: testUserId,
      }),
      await Game.create({
        _id: testGameId,
        channelId: testChannelId,
      }),
    ]);
  });

  beforeEach(() => {
    const gameUsers = [
      {
        userId: testUserId,
        userName: 'testUser',
      },
      ...mockUsers,
    ];
    gameUsers.pop();
    gameManagers[testGameId] = new GameManager(
      mockChannelId,
      testGameId,
      gameUsers,
    );
    gameManagers[testGameId].sendMessage = jest.fn();
  });

  afterEach(() => {
    const timerId = gameManagers[testGameId]?.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);
    delete gameManagers[testGameId];
    emitSpy.mockClear();
  });

  afterAll(() => {
    app.close();
  });

  describe('/join', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/game/join/${gameId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response;
    };

    it('ゲームに参加', async () => {
      const response = await customRequest(testUserId, testGameId, 200);

      expect(response.body.game).toEqual({
        _id: testGameId,
        channelId: {
          _id: testChannelId,
          channelName: 'testChannel',
          channelDescription: 'testDescription',
        },
      });
      expect(response.body.users).toEqual([
        {
          _id: testUserId,
          userName: 'testUser',
          pic: null,
        },
      ]);
      expect(emitSpy).toHaveBeenCalledWith('userJoined', {
        channelId: testGameId,
        user: {
          _id: new ObjectId(testUserId),
          userName: 'testUser',
          pic: null,
        },
      });
    });

    it('進行中のゲームがないとき', async () => {
      await customRequest(testUserId, mockGameId, 403, errors.GAME_NOT_FOUND);
    });

    it('ユーザーがチャンネルに参加していない時', async () => {
      await customRequest(
        testUser2Id,
        testGameId,
        403,
        errors.GAME_ACCESS_FORBIDDEN,
      );
    });

    it('ゲームIDがmongoIdでないとき', async () => {
      await customRequest(
        testUserId,
        'wrongGameId',
        400,
        validation.INVALID_GAME_ID,
      );
    });

    it('ユーザーが未登録のとき', async () => {
      await customRequest(mockUserId, testGameId, 401, errors.USER_NOT_FOUND);
    });
  });

  describe('/player-state', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/game/player-state/${gameId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response;
    };

    let getPlayerStateSpy: jest.SpyInstance;

    beforeEach(() => {
      getPlayerStateSpy = jest.spyOn(
        gameManagers[testGameId].playerManager,
        'getPlayerState',
      );
    });

    afterEach(() => {
      getPlayerStateSpy.mockClear();
    });

    it('プレイヤー状態を取得', async () => {
      const response = await customRequest(testUserId, testGameId, 200);

      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('status');
      expect(getPlayerStateSpy).toHaveBeenCalledWith(testUserId);
    });

    it('進行中のゲームが無いとき', async () => {
      await customRequest(testUserId, mockGameId, 403, errors.GAME_NOT_FOUND);
      expect(getPlayerStateSpy).not.toHaveBeenCalled();
    });

    it('ゲームが処理中のとき', async () => {
      const game = gameManagers[testGameId];
      game.isProcessing = true;

      await customRequest(
        testUserId,
        testGameId,
        409,
        errors.GAME_IS_PROCESSING,
      );
      expect(getPlayerStateSpy).not.toHaveBeenCalled();
    });

    it('ユーザーがゲームに参加していないとき', async () => {
      await customRequest(
        testUser2Id,
        testGameId,
        403,
        errors.GAME_ACCESS_FORBIDDEN,
      );
      expect(getPlayerStateSpy).not.toHaveBeenCalled();
    });
  });

  describe('/vote', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      selectedUser: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .post(`/api/game/vote/${gameId}`)
        .send({ selectedUser })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
    };

    let receiveVoteSpy: jest.SpyInstance;

    beforeEach(() => {
      receiveVoteSpy = jest.spyOn(
        gameManagers[testGameId].voteManager,
        'receiveVote',
      );
    });

    afterEach(() => {
      receiveVoteSpy.mockClear();
    });

    it('投票する', async () => {
      const votee = mockUsers[0].userId;
      const game = gameManagers[testGameId];

      game.phaseManager.currentPhase = 'day';

      await customRequest(testUserId, testGameId, votee, 200);
      expect(receiveVoteSpy).toHaveBeenCalledWith(testUserId, votee);
    });

    it('進行中のゲームが無いとき', async () => {
      const votee = mockUsers[0].userId;

      await customRequest(
        testUserId,
        mockGameId,
        votee,
        403,
        errors.GAME_NOT_FOUND,
      );
      expect(receiveVoteSpy).not.toHaveBeenCalled();
    });

    it('ゲームが処理中のとき', async () => {
      const votee = mockUsers[0].userId;
      const game = gameManagers[testGameId];
      game.isProcessing = true;

      await customRequest(
        testUserId,
        testGameId,
        votee,
        409,
        errors.GAME_IS_PROCESSING,
      );
      expect(receiveVoteSpy).not.toHaveBeenCalled();
    });

    it('ユーザーがゲームに参加していないとき', async () => {
      const votee = mockUsers[0].userId;

      await customRequest(
        testUser2Id,
        testGameId,
        votee,
        403,
        errors.GAME_ACCESS_FORBIDDEN,
      );
      expect(receiveVoteSpy).not.toHaveBeenCalled();
    });

    it('selectedUserが無効', async () => {
      const votee = 'wrongUserId';
      const game = gameManagers[testGameId];

      game.phaseManager.currentPhase = 'day';

      await customRequest(testUserId, testGameId, votee, 400);
      expect(receiveVoteSpy).not.toHaveBeenCalled();
    });
  });

  describe('/devine', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      selectedUser: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .post(`/api/game/devine/${gameId}`)
        .send({ selectedUser })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
    };

    let receiveDevineRequestSpy: jest.SpyInstance;

    beforeEach(() => {
      receiveDevineRequestSpy = jest.spyOn(
        gameManagers[testGameId].devineManager,
        'receiveDevineRequest',
      );
    });

    afterEach(() => {
      receiveDevineRequestSpy.mockClear();
    });

    it('占いリクエスト送信', async () => {
      const game = gameManagers[testGameId];
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUserId',
          status: 'alive',
          role: 'seer',
          teammates: [],
        },
        [mockUserId]: {
          userId: mockUserId,
          userName: 'mockUser',
          status: 'alive',
          role: 'villager',
          teammates: [],
        },
      };

      game.phaseManager.currentPhase = 'night';

      await customRequest(testUserId, testGameId, mockUserId, 200);
      expect(receiveDevineRequestSpy).toHaveBeenCalledWith(
        testUserId,
        mockUserId,
      );
    });
  });

  describe('/guard', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      selectedUser: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .post(`/api/game/guard/${gameId}`)
        .send({ selectedUser })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
    };

    let receiveGuardRequestSpy: jest.SpyInstance;

    beforeEach(() => {
      receiveGuardRequestSpy = jest.spyOn(
        gameManagers[testGameId].guardManager,
        'receiveGuradRequest',
      );
    });

    afterEach(() => {
      receiveGuardRequestSpy.mockClear();
    });

    it('護衛リクエスト送信', async () => {
      const game = gameManagers[testGameId];
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUserId',
          status: 'alive',
          role: 'hunter',
          teammates: [],
        },
        [mockUserId]: {
          userId: mockUserId,
          userName: 'mockUser',
          status: 'alive',
          role: 'villager',
          teammates: [],
        },
      };

      game.phaseManager.currentPhase = 'night';

      await customRequest(testUserId, testGameId, mockUserId, 200);
      expect(receiveGuardRequestSpy).toHaveBeenCalledWith(
        testUserId,
        mockUserId,
      );
    });
  });

  describe('/attack', () => {
    let receiveAttackRequestSpy: jest.SpyInstance;

    beforeEach(() => {
      receiveAttackRequestSpy = jest.spyOn(
        gameManagers[testGameId].attackManager,
        'receiveAttackRequest',
      );
    });

    afterEach(() => {
      receiveAttackRequestSpy.mockClear();
    });

    const customRequest = async (
      userId: string,
      gameId: string,
      selectedUser: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .post(`/api/game/attack/${gameId}`)
        .send({ selectedUser })
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);
    };

    it('襲撃リクエスト送信', async () => {
      const game = gameManagers[testGameId];
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUserId',
          status: 'alive',
          role: 'werewolf',
          teammates: [],
        },
        [mockUserId]: {
          userId: mockUserId,
          userName: 'mockUser',
          status: 'alive',
          role: 'villager',
          teammates: [],
        },
      };

      game.phaseManager.currentPhase = 'night';

      await customRequest(testUserId, testGameId, mockUserId, 200);
      expect(receiveAttackRequestSpy).toHaveBeenCalledWith(
        testUserId,
        mockUserId,
      );
    });
  });

  describe('/vote-history', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/game/vote-history/${gameId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response;
    };

    it('投票履歴を取得', async () => {
      const game = gameManagers[testGameId];
      game.phaseManager.currentPhase = 'day';
      game.voteManager.voteHistory = { 1: { votee: ['voter'] } };

      const response = await customRequest(testUserId, testGameId, 200);

      expect(response.body).toEqual({ 1: { votee: ['voter'] } });
    });
  });

  describe('/devine-result', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/game/devine-result/${gameId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response;
    };

    let getDevineResultSpy: jest.SpyInstance;

    beforeEach(() => {
      getDevineResultSpy = jest.spyOn(
        gameManagers[testGameId].devineManager,
        'getDevineResult',
      );
    });

    afterEach(() => {
      getDevineResultSpy.mockClear();
    });

    it('占い結果を取得', async () => {
      const game = gameManagers[testGameId];
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUserId',
          status: 'alive',
          role: 'seer',
          teammates: [],
        },
      };
      game.phaseManager.currentPhase = 'day';
      game.devineManager.devineResult = { 1: { target: 'villagers' } };

      const response = await customRequest(testUserId, testGameId, 200);

      expect(response.body).toEqual({ 1: { target: 'villagers' } });
      expect(getDevineResultSpy).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('/medium-result', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/game/medium-result/${gameId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response;
    };

    let getMediumResultSpy: jest.SpyInstance;

    beforeEach(() => {
      getMediumResultSpy = jest.spyOn(
        gameManagers[testGameId].mediumManager,
        'getMediumResult',
      );
    });

    afterEach(() => {
      getMediumResultSpy.mockClear();
    });

    it('霊能結果を取得', async () => {
      const game = gameManagers[testGameId];
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUserId',
          status: 'alive',
          role: 'medium',
          teammates: [],
        },
      };
      game.phaseManager.currentPhase = 'day';
      game.mediumManager.mediumResult = { 1: { target: 'villagers' } };

      const response = await customRequest(testUserId, testGameId, 200);

      expect(response.body).toEqual({ 1: { target: 'villagers' } });
      expect(getMediumResultSpy).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('/guard-history', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/game/guard-history/${gameId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response;
    };

    let getGuardHistorySpy: jest.SpyInstance;

    beforeEach(() => {
      getGuardHistorySpy = jest.spyOn(
        gameManagers[testGameId].guardManager,
        'getGuardHistory',
      );
    });

    afterEach(() => {
      getGuardHistorySpy.mockClear();
    });

    it('護衛履歴を取得', async () => {
      const game = gameManagers[testGameId];
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUserId',
          status: 'alive',
          role: 'hunter',
          teammates: [],
        },
      };
      game.phaseManager.currentPhase = 'day';
      game.guardManager.guardHistory = { 1: 'target' };

      const response = await customRequest(testUserId, testGameId, 200);

      expect(response.body).toEqual({ 1: 'target' });
      expect(getGuardHistorySpy).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('/attack-history', () => {
    const customRequest = async (
      userId: string,
      gameId: string,
      status: number,
      errorMessage?: string,
    ) => {
      const mockToken = genUserToken(userId);
      const response = await request(app)
        .get(`/api/game/attack-history/${gameId}`)
        .send()
        .set('authorization', `Bearer ${mockToken}`)
        .expect(status);

      if (errorMessage)
        expect(response.body).toHaveProperty('message', errorMessage);

      return response;
    };

    let getAttackHistorySpy: jest.SpyInstance;

    beforeEach(() => {
      getAttackHistorySpy = jest.spyOn(
        gameManagers[testGameId].attackManager,
        'getAttackHistory',
      );
    });

    afterEach(() => {
      getAttackHistorySpy.mockClear();
    });

    it('襲撃履歴を取得', async () => {
      const game = gameManagers[testGameId];
      game.playerManager.players = {
        [testUserId]: {
          userId: testUserId,
          userName: 'testUserId',
          status: 'alive',
          role: 'werewolf',
          teammates: [],
        },
      };
      game.phaseManager.currentPhase = 'day';
      game.attackManager.attackHistory = { 1: 'target' };

      const response = await customRequest(testUserId, testGameId, 200);

      expect(response.body).toEqual({ 1: 'target' });
      expect(getAttackHistorySpy).toHaveBeenCalledWith(testUserId);
    });
  });
});
