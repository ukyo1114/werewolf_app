import ChannelManager from '../../src/classes/ChannelManager';
import { appState } from '../../src/config/appState';

describe('ChannelManager', () => {
  let channelManager: ChannelManager;
  const mockChannelId = 'test-channel-123';

  beforeEach(() => {
    channelManager = new ChannelManager(mockChannelId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    it('正しい初期値でインスタンスを作成する', () => {
      expect(channelManager.channelId).toBe(mockChannelId);
      expect(channelManager.users).toEqual({});
    });
  });

  describe('ユーザー管理', () => {
    const mockUserId = 'user123';
    const mockSocketId = 'socket456';

    describe('userJoined', () => {
      it('ユーザーがチャンネルに参加する', () => {
        channelManager.userJoined(mockUserId, mockSocketId);

        expect(channelManager.users[mockUserId]).toBeDefined();
        expect(channelManager.users[mockUserId].userId).toBe(mockUserId);
        expect(channelManager.users[mockUserId].socketId).toBe(mockSocketId);
        expect(channelManager.users[mockUserId].status).toBe('normal');
      });
    });

    describe('userLeft', () => {
      it('ユーザーがチャンネルから退出する', () => {
        channelManager.userJoined(mockUserId, mockSocketId);
        expect(channelManager.users[mockUserId]).toBeDefined();

        channelManager.userLeft(mockUserId);
        expect(channelManager.users[mockUserId]).toBeUndefined();
      });
    });
  });

  describe('メッセージ関連', () => {
    const mockUserId = 'user123';

    beforeEach(() => {
      channelManager.userJoined(mockUserId, 'socket456');
    });

    describe('getSendMessageType', () => {
      it('ユーザーの送信メッセージタイプを取得する', () => {
        const messageType = channelManager.getSendMessageType(mockUserId);
        expect(messageType).toBe('normal');
      });

      it('存在しないユーザーの場合はエラーを投げる', () => {
        expect(() => {
          channelManager.getSendMessageType('non-existent-user');
        }).toThrow();
      });
    });

    describe('getMessageReceivers', () => {
      it('メッセージ受信者リストを取得する（現在は空配列を返す）', () => {
        const receivers = channelManager.getMessageReceivers();
        expect(receivers).toEqual([]);
      });
    });

    describe('getReceiveMessageType', () => {
      it('ユーザーの受信メッセージタイプを取得する（現在はundefinedを返す）', () => {
        const messageTypes = channelManager.getReceiveMessageType(mockUserId);
        expect(messageTypes).toBeUndefined();
      });

      it('存在しないユーザーの場合はエラーを投げる', () => {
        expect(() => {
          channelManager.getReceiveMessageType('non-existent-user');
        }).toThrow();
      });
    });
  });

  describe('アクセス制御', () => {
    describe('checkCanUserAccessChannel', () => {
      it('存在するユーザーの場合はエラーを投げない', () => {
        const mockUserId = 'user123';
        channelManager.userJoined(mockUserId, 'socket456');

        expect(() => {
          channelManager.checkCanUserAccessChannel(mockUserId);
        }).not.toThrow();
      });

      it('存在しないユーザーの場合はエラーを投げる', () => {
        expect(() => {
          channelManager.checkCanUserAccessChannel('non-existent-user');
        }).toThrow();
      });
    });
  });

  describe('内部クラス', () => {
    describe('ChannelUserManager', () => {
      it('ユーザーインスタンスを正しく作成する', () => {
        const mockUserId = 'user123';
        const mockSocketId = 'socket456';

        channelManager.userJoined(mockUserId, mockSocketId);
        const userInstance = channelManager.users[mockUserId];

        expect(userInstance.userId).toBe(mockUserId);
        expect(userInstance.socketId).toBe(mockSocketId);
        expect(userInstance.status).toBe('normal');
      });

      it('killメソッドでユーザーをspectator状態にする', () => {
        const mockUserId = 'user123';
        channelManager.userJoined(mockUserId, 'socket456');

        expect(channelManager.users[mockUserId].status).toBe('normal');

        channelManager.users[mockUserId].kill();
        expect(channelManager.users[mockUserId].status).toBe('spectator');
      });
    });
  });

  describe('統合テスト', () => {
    it('ユーザーのライフサイクル（参加→操作→退出）', () => {
      const mockUserId = 'user123';
      const mockSocketId = 'socket456';

      // ユーザー参加
      channelManager.userJoined(mockUserId, mockSocketId);
      expect(channelManager.users[mockUserId]).toBeDefined();
      expect(channelManager.users[mockUserId].status).toBe('normal');

      // メッセージタイプ取得
      const sendType = channelManager.getSendMessageType(mockUserId);
      expect(sendType).toBe('normal');

      // ユーザー状態変更
      channelManager.users[mockUserId].kill();
      expect(channelManager.users[mockUserId].status).toBe('spectator');

      // ユーザー退出
      channelManager.userLeft(mockUserId);
      expect(channelManager.users[mockUserId]).toBeUndefined();
    });
  });
});
