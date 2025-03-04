jest.mock('../../src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));

import app, { appState } from '../../src/app';
import { decodeToken } from '../../src/utils/decodeToken';
import request from 'supertest';
import User from '../../src/models/userModel';
import Channel from '../../src/models/channelModel';
import Game from '../../src/models/gameModel';
import {
  mockChannelId,
  mockUserId,
  mockGameId,
  mockUsers,
} from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import { errors, validation } from '../../src/config/messages';
import ChannelUser from '../../src/models/channelUserModel';

const { gameManagers } = appState;

let testUserId: string;
let testUser2Id: string;
let testChannelId: string;
let testGameId: string;

beforeAll(async () => {
  const [testUser, testUser2] = await Promise.all([
    User.create({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    }),
    User.create({
      userName: 'testUser2',
      email: 'test2@example.com',
      password: 'password123',
      pic: null,
      isGuest: false,
    }),
  ]);

  testUserId = testUser._id.toString();
  testUser2Id = testUser2._id.toString();

  const channel = await Channel.create({
    channelName: 'testChannel',
    channelDescription: 'testDescription',
    channelAdmin: testUserId,
  });

  testChannelId = channel._id.toString();

  await ChannelUser.create({
    channelId: testChannelId,
    userId: testUserId,
  });

  const game = await Game.create({
    channelId: testChannelId,
  });

  testGameId = game._id.toString();
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

  if (timerId) {
    clearTimeout(timerId);
  }
  delete gameManagers[testGameId];
  jest.restoreAllMocks();
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
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .get(`/api/game/join/${gameId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
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
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .get(`/api/game/player-state/${gameId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response;
  };

  it('プレイヤー状態を取得', async () => {
    const response = await customRequest(testUserId, testGameId, 200);

    expect(response.body).toHaveProperty('role');
    expect(response.body).toHaveProperty('status');
  });

  it('進行中のゲームが無いとき', async () => {
    await customRequest(testUserId, mockGameId, 403, errors.GAME_NOT_FOUND);
  });

  it('ゲームが処理中のとき', async () => {
    const game = gameManagers[testGameId];
    game.isProcessing = true;

    await customRequest(testUserId, testGameId, 409, errors.GAME_IS_PROCESSING);
  });

  it('ユーザーがゲームに参加していないとき', async () => {
    await customRequest(
      testUser2Id,
      testGameId,
      403,
      errors.GAME_ACCESS_FORBIDDEN,
    );
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
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .post(`/api/game/vote/${gameId}`)
      .send({ selectedUser })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);
  };

  it('投票する', async () => {
    const votee = mockUsers[0].userId;
    const game = gameManagers[testGameId];

    game.phaseManager.currentPhase = 'day';

    await customRequest(testUserId, testGameId, votee, 200);
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
  });

  it('selectedUserが無効', async () => {
    const votee = 'wrongUserId';
    const game = gameManagers[testGameId];

    game.phaseManager.currentPhase = 'day';

    await customRequest(testUserId, testGameId, votee, 400);
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
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .post(`/api/game/devine/${gameId}`)
      .send({ selectedUser })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);
  };

  it('占いリクエスト送信', async () => {
    const game = gameManagers[testGameId];
    game.playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUserId',
        status: 'alive',
        role: 'seer',
      },
      [mockUserId]: {
        userId: mockUserId,
        userName: 'mockUser',
        status: 'alive',
        role: 'villager',
      },
    };

    game.phaseManager.currentPhase = 'night';

    await customRequest(testUserId, testGameId, mockUserId, 200);
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
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .post(`/api/game/guard/${gameId}`)
      .send({ selectedUser })
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);
  };

  it('護衛リクエスト送信', async () => {
    const game = gameManagers[testGameId];
    game.playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUserId',
        status: 'alive',
        role: 'hunter',
      },
      [mockUserId]: {
        userId: mockUserId,
        userName: 'mockUser',
        status: 'alive',
        role: 'villager',
      },
    };

    game.phaseManager.currentPhase = 'night';

    await customRequest(testUserId, testGameId, mockUserId, 200);
  });
});

describe('/attack', () => {
  const customRequest = async (
    userId: string,
    gameId: string,
    selectedUser: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .post(`/api/game/attack/${gameId}`)
      .send({ selectedUser })
      .set('authorization', 'Bearer mockToken')
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
      },
      [mockUserId]: {
        userId: mockUserId,
        userName: 'mockUser',
        status: 'alive',
        role: 'villager',
      },
    };

    game.phaseManager.currentPhase = 'night';

    await customRequest(testUserId, testGameId, mockUserId, 200);
  });
});

describe('/vote-history', () => {
  const customRequest = async (
    userId: string,
    gameId: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .get(`/api/game/vote-history/${gameId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
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
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .get(`/api/game/devine-result/${gameId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response;
  };

  it('占い結果を取得', async () => {
    const game = gameManagers[testGameId];
    game.playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUserId',
        status: 'alive',
        role: 'seer',
      },
    };
    game.phaseManager.currentPhase = 'day';
    game.devineManager.devineResult = { 1: { target: 'villagers' } };

    const response = await customRequest(testUserId, testGameId, 200);

    expect(response.body).toEqual({ 1: { target: 'villagers' } });
  });
});

describe('/medium-result', () => {
  const customRequest = async (
    userId: string,
    gameId: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .get(`/api/game/medium-result/${gameId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response;
  };

  it('霊能結果を取得', async () => {
    const game = gameManagers[testGameId];
    game.playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUserId',
        status: 'alive',
        role: 'medium',
      },
    };
    game.phaseManager.currentPhase = 'day';
    game.mediumManager.mediumResult = { 1: { target: 'villagers' } };

    const response = await customRequest(testUserId, testGameId, 200);

    expect(response.body).toEqual({ 1: { target: 'villagers' } });
  });
});

describe('/guard-history', () => {
  const customRequest = async (
    userId: string,
    gameId: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .get(`/api/game/guard-history/${gameId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response;
  };

  it('護衛履歴を取得', async () => {
    const game = gameManagers[testGameId];
    game.playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUserId',
        status: 'alive',
        role: 'hunter',
      },
    };
    game.phaseManager.currentPhase = 'day';
    game.guardManager.guardHistory = { 1: 'target' };

    const response = await customRequest(testUserId, testGameId, 200);

    expect(response.body).toEqual({ 1: 'target' });
  });
});

describe('/attack-history', () => {
  const customRequest = async (
    userId: string,
    gameId: string,
    status: number,
    errorMessage?: string,
  ) => {
    (decodeToken as jest.Mock).mockReturnValue({ userId });

    const response = await request(app)
      .get(`/api/game/attack-history/${gameId}`)
      .send()
      .set('authorization', 'Bearer mockToken')
      .expect(status);

    if (errorMessage)
      expect(response.body).toHaveProperty('message', errorMessage);

    return response;
  };

  it('襲撃履歴を取得', async () => {
    const game = gameManagers[testGameId];
    game.playerManager.players = {
      [testUserId]: {
        userId: testUserId,
        userName: 'testUserId',
        status: 'alive',
        role: 'werewolf',
      },
    };
    game.phaseManager.currentPhase = 'day';
    game.attackManager.attackHistory = { 1: 'target' };

    const response = await customRequest(testUserId, testGameId, 200);

    expect(response.body).toEqual({ 1: 'target' });
  });
});
