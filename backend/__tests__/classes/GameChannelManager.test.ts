import GameChannelManager from '../../src/classes/GameChannelManager';
import ChannelManager from '../../src/classes/ChannelManager';
import GameManager from '../../src/classes/GameManager';
import { appState } from '../../src/config/appState';

// GameManagerをモック
jest.mock('../../src/classes/GameManager', () => {
  return jest.fn().mockImplementation(() => ({
    playerManager: {
      players: {},
    },
    phaseManager: {
      currentPhase: 'day',
    },
  }));
});

describe('GameChannelManager', () => {
  let gameChannelManager: GameChannelManager;
  let mockGameManager: any;
  const mockGameId = 'test-game-123';

  beforeEach(() => {
    // GameManagerのモックインスタンスを作成
    mockGameManager = new GameManager('mockChannelId', 'mockGameId', []);

    // プレイヤーデータを設定
    mockGameManager.playerManager.players = {
      player1: { userId: 'player1', status: 'alive', role: 'villager' },
      player2: { userId: 'player2', status: 'alive', role: 'werewolf' },
      player3: { userId: 'player3', status: 'alive', role: 'freemason' },
      player4: { userId: 'player4', status: 'dead', role: 'villager' },
      player5: { userId: 'player5', status: 'alive', role: 'seer' },
    };

    gameChannelManager = new GameChannelManager(mockGameId, mockGameManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    it('正しい初期値でインスタンスを作成する', () => {
      expect(gameChannelManager.channelId).toBe(mockGameId);
      expect(gameChannelManager.users).toEqual({});
      expect(gameChannelManager).toBeInstanceOf(ChannelManager);
      expect(gameChannelManager).toBeInstanceOf(GameChannelManager);
    });
  });

  describe('静的メソッド', () => {
    describe('createChannelInstance', () => {
      it('ゲームチャンネルインスタンスを作成してappStateに保存する', async () => {
        const newGameId = 'new-game-456';
        const newGameManager = new GameManager('mockChannelId', newGameId, []);

        // appStateにゲームマネージャーを設定
        appState.gameManagers[newGameId] = newGameManager;

        const channelInstance =
          await GameChannelManager.createChannelInstance(newGameId);

        expect(channelInstance).toBeInstanceOf(GameChannelManager);
        expect(channelInstance.channelId).toBe(newGameId);
        expect(appState.channelManagers[newGameId]).toBe(channelInstance);
      });

      it('存在しないゲームIDの場合はエラーを投げる', async () => {
        const nonExistentGameId = 'non-existent-game';

        expect(async () => {
          await GameChannelManager.createChannelInstance(nonExistentGameId);
        }).rejects.toThrow();
      });
    });
  });

  describe('ユーザー管理', () => {
    const mockUserId = 'player1';
    const mockSocketId = 'socket123';

    describe('userJoined', () => {
      it('生存している村人ユーザーが参加する', () => {
        gameChannelManager.userJoined('player1', mockSocketId);

        expect(gameChannelManager.users['player1']).toBeDefined();
        expect(gameChannelManager.users['player1'].status).toBe('normal');
      });

      it('生存している人狼ユーザーが参加する', () => {
        gameChannelManager.userJoined('player2', mockSocketId);

        expect(gameChannelManager.users['player2']).toBeDefined();
        expect(gameChannelManager.users['player2'].status).toBe('werewolf');
      });

      it('生存しているフリーメイソンユーザーが参加する', () => {
        gameChannelManager.userJoined('player3', mockSocketId);

        expect(gameChannelManager.users['player3']).toBeDefined();
        expect(gameChannelManager.users['player3'].status).toBe('freemason');
      });

      it('死亡しているユーザーが参加する（spectator状態）', () => {
        gameChannelManager.userJoined('player4', mockSocketId);

        expect(gameChannelManager.users['player4']).toBeDefined();
        expect(gameChannelManager.users['player4'].status).toBe('spectator');
      });

      it('存在しないプレイヤーが参加する（spectator状態）', () => {
        gameChannelManager.userJoined('non-existent-player', mockSocketId);

        expect(gameChannelManager.users['non-existent-player']).toBeDefined();
        expect(gameChannelManager.users['non-existent-player'].status).toBe(
          'spectator',
        );
      });
    });
  });

  describe('メッセージ送信制御', () => {
    beforeEach(() => {
      // テスト用ユーザーを追加
      gameChannelManager.userJoined('player1', 'socket1'); // 村人
      gameChannelManager.userJoined('player2', 'socket2'); // 人狼
      gameChannelManager.userJoined('player3', 'socket3'); // フリーメイソン
      gameChannelManager.userJoined('player4', 'socket4'); // 死亡者
    });

    describe('getSendMessageType', () => {
      it('昼のフェーズで村人がメッセージを送信できる', () => {
        mockGameManager.phaseManager.currentPhase = 'day';

        const messageType = gameChannelManager.getSendMessageType('player1');
        expect(messageType).toBe('normal');
      });

      it('昼のフェーズで人狼がメッセージを送信できる', () => {
        mockGameManager.phaseManager.currentPhase = 'day';

        const messageType = gameChannelManager.getSendMessageType('player2');
        expect(messageType).toBe('normal');
      });

      it('夜のフェーズで人狼が人狼メッセージを送信できる', () => {
        mockGameManager.phaseManager.currentPhase = 'night';

        const messageType = gameChannelManager.getSendMessageType('player2');
        expect(messageType).toBe('werewolf');
      });

      it('夜のフェーズでフリーメイソンがフリーメイソンメッセージを送信できる', () => {
        mockGameManager.phaseManager.currentPhase = 'night';

        const messageType = gameChannelManager.getSendMessageType('player3');
        expect(messageType).toBe('freemason');
      });

      it('夜のフェーズで村人がメッセージを送信できない（エラー）', () => {
        mockGameManager.phaseManager.currentPhase = 'night';

        expect(() => {
          gameChannelManager.getSendMessageType('player1');
        }).toThrow();
      });

      it('ゲーム終了後は誰でもメッセージを送信できる', () => {
        mockGameManager.phaseManager.currentPhase = 'finished';

        const messageType = gameChannelManager.getSendMessageType('player1');
        expect(messageType).toBe('normal');
      });

      it('spectator状態のユーザーはspectatorメッセージを送信できる', () => {
        mockGameManager.phaseManager.currentPhase = 'day';

        const messageType = gameChannelManager.getSendMessageType('player4');
        expect(messageType).toBe('spectator');
      });
    });
  });

  describe('メッセージ受信制御', () => {
    beforeEach(() => {
      // テスト用ユーザーを追加
      gameChannelManager.userJoined('player1', 'socket1'); // 村人
      gameChannelManager.userJoined('player2', 'socket2'); // 人狼
      gameChannelManager.userJoined('player3', 'socket3'); // フリーメイソン
      gameChannelManager.userJoined('player4', 'socket4'); // 死亡者
    });

    describe('getReceiveMessageType', () => {
      it('村人は通常メッセージのみ受信できる', () => {
        const messageTypes =
          gameChannelManager.getReceiveMessageType('player1');
        expect(messageTypes).toEqual(['normal']);
      });

      it('人狼は通常メッセージと人狼メッセージを受信できる', () => {
        const messageTypes =
          gameChannelManager.getReceiveMessageType('player2');
        expect(messageTypes).toEqual(['normal', 'werewolf']);
      });

      it('フリーメイソンは通常メッセージとフリーメイソンメッセージを受信できる', () => {
        const messageTypes =
          gameChannelManager.getReceiveMessageType('player3');
        expect(messageTypes).toEqual(['normal', 'freemason']);
      });

      it('spectator状態のユーザーは何も受信できない', () => {
        const messageTypes =
          gameChannelManager.getReceiveMessageType('player4');
        expect(messageTypes).toBeUndefined();
      });

      it('ゲーム終了後は何も受信できない', () => {
        mockGameManager.phaseManager.currentPhase = 'finished';

        const messageTypes =
          gameChannelManager.getReceiveMessageType('player1');
        expect(messageTypes).toBeUndefined();
      });
    });
  });

  describe('メッセージ受信者管理', () => {
    beforeEach(() => {
      // テスト用ユーザーを追加
      gameChannelManager.userJoined('player1', 'socket1'); // 村人
      gameChannelManager.userJoined('player2', 'socket2'); // 人狼
      gameChannelManager.userJoined('player3', 'socket3'); // フリーメイソン
      gameChannelManager.userJoined('player4', 'socket4'); // 死亡者
    });

    describe('getMessageReceivers', () => {
      it('通常メッセージの受信者リストを取得する（空配列）', () => {
        const receivers = gameChannelManager.getMessageReceivers('normal');
        expect(receivers).toEqual([]);
      });

      it('システムメッセージの受信者リストを取得する（空配列）', () => {
        const receivers = gameChannelManager.getMessageReceivers('system');
        expect(receivers).toEqual([]);
      });

      it('spectatorメッセージの受信者リストを取得する', () => {
        const receivers = gameChannelManager.getMessageReceivers('spectator');
        expect(receivers).toContain('socket4'); // 死亡者のsocketId
      });

      it('人狼メッセージの受信者リストを取得する', () => {
        const receivers = gameChannelManager.getMessageReceivers('werewolf');
        expect(receivers).toContain('socket2'); // 人狼のsocketId
        expect(receivers).toContain('socket4'); // spectatorも含む
      });

      it('フリーメイソンメッセージの受信者リストを取得する', () => {
        const receivers = gameChannelManager.getMessageReceivers('freemason');
        expect(receivers).toContain('socket3'); // フリーメイソンのsocketId
        expect(receivers).toContain('socket4'); // spectatorも含む
      });

      it('無効なメッセージタイプの場合はエラーを投げる', () => {
        expect(() => {
          gameChannelManager.getMessageReceivers('invalid' as any);
        }).toThrow();
      });
    });

    describe('getUsersByStatus', () => {
      it('特定のステータスのユーザーのsocketIdリストを取得する', () => {
        // プライベートメソッドにアクセスするため、型アサーションを使用
        const werewolves = (gameChannelManager as any).getUsersByStatus(
          'werewolf',
        );
        expect(werewolves).toContain('socket2');

        const freemasons = (gameChannelManager as any).getUsersByStatus(
          'freemason',
        );
        expect(freemasons).toContain('socket3');

        const spectators = (gameChannelManager as any).getUsersByStatus(
          'spectator',
        );
        expect(spectators).toContain('socket4');
      });
    });
  });

  describe('統合テスト', () => {
    it('ゲームフェーズに応じたメッセージ制御の動作', () => {
      // ユーザーを追加
      gameChannelManager.userJoined('player1', 'socket1'); // 村人
      gameChannelManager.userJoined('player2', 'socket2'); // 人狼

      // 昼のフェーズ
      mockGameManager.phaseManager.currentPhase = 'day';
      expect(gameChannelManager.getSendMessageType('player1')).toBe('normal');
      expect(gameChannelManager.getSendMessageType('player2')).toBe('normal');

      // 夜のフェーズ
      mockGameManager.phaseManager.currentPhase = 'night';
      expect(() => gameChannelManager.getSendMessageType('player1')).toThrow();
      expect(gameChannelManager.getSendMessageType('player2')).toBe('werewolf');

      // ゲーム終了後
      mockGameManager.phaseManager.currentPhase = 'finished';
      expect(gameChannelManager.getSendMessageType('player1')).toBe('normal');
      expect(gameChannelManager.getSendMessageType('player2')).toBe('normal');
    });

    it('ユーザーの役職と状態に応じたメッセージ受信制御', () => {
      // ユーザーを追加
      gameChannelManager.userJoined('player1', 'socket1'); // 村人
      gameChannelManager.userJoined('player2', 'socket2'); // 人狼
      gameChannelManager.userJoined('player3', 'socket3'); // フリーメイソン

      // 受信可能なメッセージタイプを確認
      expect(gameChannelManager.getReceiveMessageType('player1')).toEqual([
        'normal',
      ]);
      expect(gameChannelManager.getReceiveMessageType('player2')).toEqual([
        'normal',
        'werewolf',
      ]);
      expect(gameChannelManager.getReceiveMessageType('player3')).toEqual([
        'normal',
        'freemason',
      ]);

      // メッセージ受信者リストを確認
      const werewolfReceivers =
        gameChannelManager.getMessageReceivers('werewolf');
      expect(werewolfReceivers).toContain('socket2');

      const freemasonReceivers =
        gameChannelManager.getMessageReceivers('freemason');
      expect(freemasonReceivers).toContain('socket3');
    });
  });
});
