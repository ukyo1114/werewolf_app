import { EventEmitter } from 'events';

// モックの設定
jest.mock('../../src/models/Users');
jest.mock('../../src/models/GameUsers');
jest.mock('../../src/models/ChannelUsers');
jest.mock('../../src/models/BlockedUsers');
jest.mock('../../src/models/Channels');
jest.mock('../../src/models/Messages');
jest.mock('../../src/utils/uploadPicture');
jest.mock('../../src/utils/sendMail');
jest.mock('../../src/utils/generateToken');
jest.mock('../../src/utils/decodeToken');
jest.mock('../../src/utils/TransactionHelper');
jest.mock('../../src/config/appState', () => ({
  Events: {
    channelEvents: new EventEmitter(),
  },
}));

import mongoose from 'mongoose';
import { UserService } from '../../src/services/user/services';
import Users from '../../src/models/Users';
import ChannelUsers from '../../src/models/ChannelUsers';
import Channels from '../../src/models/Channels';
import Messages from '../../src/models/Messages';

describe('UserService', () => {
  let userService: UserService;
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockChannelId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('ユーザー名のみ更新する場合、picUrlはundefinedを返す', async () => {
      const mockChannelIds = [mockChannelId];
      (ChannelUsers.getParticipantingChannels as jest.Mock).mockResolvedValue(
        mockChannelIds,
      );

      const result = await userService.updateProfile({
        userId: mockUserId,
        userName: 'NewUserName',
      });

      expect(result).toBeUndefined();
      expect(Users.updateProfile).toHaveBeenCalledWith(mockUserId, {
        userName: 'NewUserName',
        pic: undefined,
      });
    });

    it('画像のみ更新する場合、picUrlを返す', async () => {
      const mockPicUrl = 'https://example.com/image.jpg';
      const mockChannelIds = [mockChannelId];
      (
        require('../../src/utils/uploadPicture').uploadPicture as jest.Mock
      ).mockResolvedValue(mockPicUrl);
      (ChannelUsers.getParticipantingChannels as jest.Mock).mockResolvedValue(
        mockChannelIds,
      );

      const result = await userService.updateProfile({
        userId: mockUserId,
        pic: 'base64image',
      });

      expect(result).toBe(mockPicUrl);
      expect(Users.updateProfile).toHaveBeenCalledWith(mockUserId, {
        userName: undefined,
        pic: mockPicUrl,
      });
    });

    it('ユーザー名と画像の両方を更新する場合、picUrlを返す', async () => {
      const mockPicUrl = 'https://example.com/image.jpg';
      const mockChannelIds = [mockChannelId];
      (
        require('../../src/utils/uploadPicture').uploadPicture as jest.Mock
      ).mockResolvedValue(mockPicUrl);
      (ChannelUsers.getParticipantingChannels as jest.Mock).mockResolvedValue(
        mockChannelIds,
      );

      const result = await userService.updateProfile({
        userId: mockUserId,
        userName: 'NewUserName',
        pic: 'base64image',
      });

      expect(result).toBe(mockPicUrl);
      expect(Users.updateProfile).toHaveBeenCalledWith(mockUserId, {
        userName: 'NewUserName',
        pic: mockPicUrl,
      });
    });
  });

  describe('sendVerificationEmail', () => {
    it('registerUserアクションで正常に処理される', async () => {
      (Users.checkEmailAvailable as jest.Mock).mockResolvedValue(undefined);
      (
        require('../../src/utils/generateToken')
          .genVerificationToken as jest.Mock
      ).mockReturnValue('token123');
      (
        require('../../src/utils/sendMail').sendMail as jest.Mock
      ).mockResolvedValue(undefined);

      await expect(
        userService.sendVerificationEmail('test@example.com', 'registerUser'),
      ).resolves.not.toThrow();

      expect(Users.checkEmailAvailable).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(
        require('../../src/utils/generateToken').genVerificationToken,
      ).toHaveBeenCalledWith({
        userId: undefined,
        email: 'test@example.com',
        action: 'registerUser',
      });
    });

    it('forgotPasswordアクションで正常に処理される', async () => {
      (Users.checkEmailRegisterd as jest.Mock).mockResolvedValue(undefined);
      (
        require('@/utils/generateToken').genVerificationToken as jest.Mock
      ).mockReturnValue('token123');
      (require('@/utils/sendMail').sendMail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await expect(
        userService.sendVerificationEmail('test@example.com', 'forgotPassword'),
      ).resolves.not.toThrow();

      expect(Users.checkEmailRegisterd).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });

  describe('registerUser', () => {
    it('ユーザーを正常に登録する', async () => {
      const mockToken = 'validToken123';
      const mockDecodedToken = {
        email: 'test@example.com',
        action: 'registerUser',
      };
      const mockUserId = 'newUserId123';
      const mockUserToken = 'userToken123';

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );
      (Users.register as jest.Mock).mockResolvedValue(mockUserId);
      (
        require('@/utils/generateToken').genUserToken as jest.Mock
      ).mockReturnValue(mockUserToken);

      const result = await userService.registerUser(
        'TestUser',
        'password123',
        mockToken,
      );

      expect(result).toEqual({
        userId: mockUserId,
        token: mockUserToken,
      });
      expect(require('@/utils/decodeToken').decodeToken).toHaveBeenCalledWith(
        mockToken,
      );
      expect(Users.register).toHaveBeenCalledWith(
        'TestUser',
        'test@example.com',
        'password123',
      );
      expect(
        require('@/utils/generateToken').genUserToken,
      ).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('login', () => {
    it('ユーザーを正常にログインする', async () => {
      const mockEmail = 'test@example.com';
      const mockPassword = 'password123';
      const mockUser = {
        _id: mockUserId,
        userName: 'TestUser',
        pic: 'pic.jpg',
      };
      const mockUserToken = 'userToken123';

      (Users.login as jest.Mock).mockResolvedValue(mockUser);
      (
        require('@/utils/generateToken').genUserToken as jest.Mock
      ).mockReturnValue(mockUserToken);

      const result = await userService.login(mockEmail, mockPassword);

      expect(result).toEqual({
        userId: mockUserId,
        userName: 'TestUser',
        pic: 'pic.jpg',
        token: mockUserToken,
      });
      expect(Users.login).toHaveBeenCalledWith(mockEmail, mockPassword);
      expect(
        require('@/utils/generateToken').genUserToken,
      ).toHaveBeenCalledWith(mockUserId);
    });

    it('プロフィール画像がない場合のログイン', async () => {
      const mockEmail = 'test@example.com';
      const mockPassword = 'password123';
      const mockUser = {
        _id: mockUserId,
        userName: 'TestUser',
        pic: undefined,
      };
      const mockUserToken = 'userToken123';

      (Users.login as jest.Mock).mockResolvedValue(mockUser);
      (
        require('@/utils/generateToken').genUserToken as jest.Mock
      ).mockReturnValue(mockUserToken);

      const result = await userService.login(mockEmail, mockPassword);

      expect(result).toEqual({
        userId: mockUserId,
        userName: 'TestUser',
        pic: undefined,
        token: mockUserToken,
      });
      expect(Users.login).toHaveBeenCalledWith(mockEmail, mockPassword);
      expect(
        require('@/utils/generateToken').genUserToken,
      ).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('loginAsGuest', () => {
    it('ゲストユーザーを正常にログインする', async () => {
      const mockGuestUser = {
        _id: mockUserId,
        userName: 'Guest',
        isGuest: true,
      };
      const mockUserToken = 'guestToken123';

      (Users.loginAsGuest as jest.Mock).mockResolvedValue(mockGuestUser);
      (
        require('@/utils/generateToken').genUserToken as jest.Mock
      ).mockReturnValue(mockUserToken);

      const result = await userService.loginAsGuest();

      expect(result).toEqual({
        userId: mockUserId,
        token: mockUserToken,
      });
      expect(Users.loginAsGuest).toHaveBeenCalled();
      expect(
        require('@/utils/generateToken').genUserToken,
      ).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('updateEmail', () => {
    it('メールアドレスを正常に更新する', async () => {
      const mockToken = 'validToken123';
      const mockDecodedToken = {
        userId: mockUserId,
        email: 'newemail@example.com',
        action: 'changeEmail',
      };

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );
      (Users.updateEmail as jest.Mock).mockResolvedValue(undefined);

      await expect(userService.updateEmail(mockToken)).resolves.not.toThrow();

      expect(require('@/utils/decodeToken').decodeToken).toHaveBeenCalledWith(
        mockToken,
      );
      expect(Users.updateEmail).toHaveBeenCalledWith(
        mockUserId,
        'newemail@example.com',
      );
    });
  });

  describe('resetPassword', () => {
    it('パスワードを正常にリセットする', async () => {
      const mockToken = 'validToken123';
      const mockDecodedToken = {
        email: 'test@example.com',
        action: 'forgotPassword',
      };
      const newPassword = 'newPassword123';

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );
      (Users.resetPassword as jest.Mock).mockResolvedValue(undefined);

      await expect(
        userService.resetPassword(newPassword, mockToken),
      ).resolves.not.toThrow();

      expect(require('@/utils/decodeToken').decodeToken).toHaveBeenCalledWith(
        mockToken,
      );
      expect(Users.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        newPassword,
      );
    });
  });

  describe('deleteUser', () => {
    it('ユーザーを正常に削除する', async () => {
      const mockChannels = [{ _id: mockChannelId, channelAdmin: mockUserId }];

      (
        require('@/models/GameUsers').default.checkUserPlaying as jest.Mock
      ).mockResolvedValue(undefined);
      (Channels.find as jest.Mock).mockResolvedValue(mockChannels);
      (ChannelUsers.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (
        require('@/models/BlockedUsers').default.deleteMany as jest.Mock
      ).mockResolvedValue(undefined);
      (Messages.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (Channels.deleteChannel as jest.Mock).mockResolvedValue(undefined);
      (Users.softDelete as jest.Mock).mockResolvedValue(undefined);

      await expect(userService.deleteUser(mockUserId)).resolves.not.toThrow();

      expect(
        require('@/models/GameUsers').default.checkUserPlaying,
      ).toHaveBeenCalledWith(mockUserId);
    });

    it('ユーザーがゲーム中の場合、削除を拒否する', async () => {
      (
        require('@/models/GameUsers').default.checkUserPlaying as jest.Mock
      ).mockRejectedValue(new Error('User is playing'));

      await expect(userService.deleteUser(mockUserId)).rejects.toThrow(
        'User is playing',
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('changeEmailアクションで正常に処理される', async () => {
      const mockUserId = 'userId123';
      const mockCurrentPassword = 'currentPassword123';

      (Users.authChangeEmail as jest.Mock).mockResolvedValue(undefined);
      (
        require('@/utils/generateToken').genVerificationToken as jest.Mock
      ).mockReturnValue('token123');
      (require('@/utils/sendMail').sendMail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await expect(
        userService.sendVerificationEmail(
          'test@example.com',
          'changeEmail',
          mockUserId,
          mockCurrentPassword,
        ),
      ).resolves.not.toThrow();

      expect(Users.authChangeEmail).toHaveBeenCalledWith(
        mockUserId,
        'test@example.com',
        mockCurrentPassword,
      );
      expect(
        require('@/utils/generateToken').genVerificationToken,
      ).toHaveBeenCalledWith({
        userId: mockUserId,
        email: 'test@example.com',
        action: 'changeEmail',
      });
    });

    it('changeEmailアクションでuserIdまたはcurrentPasswordが不足している場合、エラーを投げる', async () => {
      await expect(
        userService.sendVerificationEmail('test@example.com', 'changeEmail'),
      ).rejects.toThrow();
    });

    it('changeEmailアクションでuserIdが不足している場合、エラーを投げる', async () => {
      await expect(
        userService.sendVerificationEmail(
          'test@example.com',
          'changeEmail',
          undefined,
          'password123',
        ),
      ).rejects.toThrow();
    });

    it('changeEmailアクションでcurrentPasswordが不足している場合、エラーを投げる', async () => {
      await expect(
        userService.sendVerificationEmail(
          'test@example.com',
          'changeEmail',
          'userId123',
          undefined,
        ),
      ).rejects.toThrow();
    });

    it('registerUserアクションでメールアドレスが既に使用されている場合、エラーを投げる', async () => {
      (Users.checkEmailAvailable as jest.Mock).mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(
        userService.sendVerificationEmail('test@example.com', 'registerUser'),
      ).rejects.toThrow('Email already exists');
    });

    it('forgotPasswordアクションでメールアドレスが登録されていない場合、エラーを投げる', async () => {
      (Users.checkEmailRegisterd as jest.Mock).mockRejectedValue(
        new Error('Email not registered'),
      );

      await expect(
        userService.sendVerificationEmail('test@example.com', 'forgotPassword'),
      ).rejects.toThrow('Email not registered');
    });

    it('メール送信に失敗した場合、エラーを投げる', async () => {
      (Users.checkEmailAvailable as jest.Mock).mockResolvedValue(undefined);
      (
        require('@/utils/generateToken').genVerificationToken as jest.Mock
      ).mockReturnValue('token123');
      (require('@/utils/sendMail').sendMail as jest.Mock).mockRejectedValue(
        new Error('Mail sending failed'),
      );

      await expect(
        userService.sendVerificationEmail('test@example.com', 'registerUser'),
      ).rejects.toThrow('Mail sending failed');
    });
  });

  describe('updateProfile', () => {
    it('画像アップロードに失敗した場合、エラーを投げる', async () => {
      const mockChannelIds = [mockChannelId];
      (
        require('@/utils/uploadPicture').uploadPicture as jest.Mock
      ).mockRejectedValue(new Error('Upload failed'));
      (ChannelUsers.getParticipantingChannels as jest.Mock).mockResolvedValue(
        mockChannelIds,
      );

      await expect(
        userService.updateProfile({
          userId: mockUserId,
          pic: 'base64image',
        }),
      ).rejects.toThrow('Upload failed');
    });

    it('プロフィール更新に失敗した場合、エラーを投げる', async () => {
      const mockChannelIds = [mockChannelId];
      (Users.updateProfile as jest.Mock).mockRejectedValue(
        new Error('Update failed'),
      );
      (ChannelUsers.getParticipantingChannels as jest.Mock).mockResolvedValue(
        mockChannelIds,
      );

      await expect(
        userService.updateProfile({
          userId: mockUserId,
          userName: 'NewUserName',
        }),
      ).rejects.toThrow('Update failed');
    });

    it('チャンネル情報の取得に失敗した場合、エラーを投げる', async () => {
      (ChannelUsers.getParticipantingChannels as jest.Mock).mockRejectedValue(
        new Error('Channel fetch failed'),
      );

      await expect(
        userService.updateProfile({
          userId: mockUserId,
          userName: 'NewUserName',
        }),
      ).rejects.toThrow();
    });
  });

  describe('registerUser', () => {
    it('無効なトークンの場合、エラーを投げる', async () => {
      const mockToken = 'invalidToken123';
      const mockDecodedToken = {
        email: 'test@example.com',
        action: 'invalidAction',
      };

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );

      await expect(
        userService.registerUser('TestUser', 'password123', mockToken),
      ).rejects.toThrow();
    });

    it('ユーザー登録に失敗した場合、エラーを投げる', async () => {
      const mockToken = 'validToken123';
      const mockDecodedToken = {
        email: 'test@example.com',
        action: 'registerUser',
      };

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );
      (Users.register as jest.Mock).mockRejectedValue(
        new Error('Registration failed'),
      );

      await expect(
        userService.registerUser('TestUser', 'password123', mockToken),
      ).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    it('ログインに失敗した場合、エラーを投げる', async () => {
      const mockEmail = 'test@example.com';
      const mockPassword = 'wrongPassword';

      (Users.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(userService.login(mockEmail, mockPassword)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('loginAsGuest', () => {
    it('ゲストログインに失敗した場合、エラーを投げる', async () => {
      (Users.loginAsGuest as jest.Mock).mockRejectedValue(
        new Error('Guest login failed'),
      );

      await expect(userService.loginAsGuest()).rejects.toThrow(
        'Guest login failed',
      );
    });
  });

  describe('updateEmail', () => {
    it('無効なトークンの場合、エラーを投げる', async () => {
      const mockToken = 'invalidToken123';
      const mockDecodedToken = {
        userId: mockUserId,
        email: 'newemail@example.com',
        action: 'invalidAction',
      };

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );

      await expect(userService.updateEmail(mockToken)).rejects.toThrow();
    });

    it('メール更新に失敗した場合、エラーを投げる', async () => {
      const mockToken = 'validToken123';
      const mockDecodedToken = {
        userId: mockUserId,
        email: 'newemail@example.com',
        action: 'changeEmail',
      };

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );
      (Users.updateEmail as jest.Mock).mockRejectedValue(
        new Error('Email update failed'),
      );

      await expect(userService.updateEmail(mockToken)).rejects.toThrow(
        'Email update failed',
      );
    });
  });

  describe('resetPassword', () => {
    it('無効なトークンの場合、エラーを投げる', async () => {
      const mockToken = 'invalidToken123';
      const mockDecodedToken = {
        email: 'test@example.com',
        action: 'invalidAction',
      };
      const newPassword = 'newPassword123';

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );

      await expect(
        userService.resetPassword(newPassword, mockToken),
      ).rejects.toThrow();
    });

    it('パスワードリセットに失敗した場合、エラーを投げる', async () => {
      const mockToken = 'validToken123';
      const mockDecodedToken = {
        email: 'test@example.com',
        action: 'forgotPassword',
      };
      const newPassword = 'newPassword123';

      (require('@/utils/decodeToken').decodeToken as jest.Mock).mockReturnValue(
        mockDecodedToken,
      );
      (Users.resetPassword as jest.Mock).mockRejectedValue(
        new Error('Password reset failed'),
      );

      await expect(
        userService.resetPassword(newPassword, mockToken),
      ).rejects.toThrow('Password reset failed');
    });
  });
});
