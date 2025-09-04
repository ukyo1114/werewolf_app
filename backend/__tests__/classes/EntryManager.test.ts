import { appState } from '../../src/config/appState';
import EntryManager from '../../src/classes/EntryManager';
import { mockUserId, mockChannelId } from '../../__mocks__/mockdata';

describe('EntryManager', () => {
  let entryManager: EntryManager;

  beforeEach(() => {
    entryManager = new EntryManager(mockChannelId, 10);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('正しい初期値でインスタンスを作成する', () => {
      expect(entryManager).toBeInstanceOf(EntryManager);
    });
  });

  describe('register', () => {
    it('ユーザーをユーザーリストに追加する', async () => {
      await entryManager.register(mockUserId, 'testSocketId');

      expect(entryManager.users).toEqual({
        testSocketId: { userId: mockUserId },
      });
    });

    it('ゲーム処理中の場合、エラーをスローする', async () => {
      entryManager.isProcessing = true;

      await expect(() =>
        entryManager.register(mockUserId, 'testSocketId'),
      ).rejects.toThrow();
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      entryManager.users = { testSocketId: { userId: mockUserId } };
    });

    it('ユーザーをユーザーリストから削除する', () => {
      entryManager.cancel('testSocketId');
      expect(entryManager.users['testSocketId']).toBeUndefined();
    });

    it('ゲーム処理中の場合、エラーをスローする', () => {
      entryManager.isProcessing = true;
      expect(() => entryManager.cancel('testSocketId')).toThrow();
    });
  });
});
