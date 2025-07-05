import jwt from 'jsonwebtoken';
import {
  genUserToken,
  genVerificationToken,
  IVerificationTokenPayload,
} from '../../src/utils/generateToken';
import { errors } from '../../src/config/messages';

describe('generateToken', () => {
  const mockSecret = 'test-secret';
  const mockUserId = 'test-user-id';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    process.env.JWT_SECRET = mockSecret;
  });

  describe('genUserToken', () => {
    it('should generate a valid user token', () => {
      const token = genUserToken(mockUserId);

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, mockSecret) as { userId: string };
      expect(decoded.userId).toBe(mockUserId);
    });

    it('should throw error when JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;

      expect(() => genUserToken(mockUserId)).toThrow(
        errors.JWT_SECRET_NOT_DEFINED,
      );
    });

    it('should generate token with 30 days expiration', () => {
      const token = genUserToken(mockUserId);
      const decoded = jwt.decode(token) as { exp: number };

      // 現在時刻から30日後のタイムスタンプを計算
      const thirtyDaysFromNow =
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      // 許容誤差を1分（60秒）に設定
      expect(Math.abs(decoded.exp - thirtyDaysFromNow)).toBeLessThan(60);
    });
  });

  describe('genVerificationToken', () => {
    const mockPayload: IVerificationTokenPayload = {
      userId: null,
      email: mockEmail,
      action: 'registerUser',
    };

    it('should generate a valid verification token', () => {
      const token = genVerificationToken(mockPayload);

      expect(token).toBeDefined();
      const decoded = jwt.decode(token) as IVerificationTokenPayload;
      expect(decoded.email).toBe(mockEmail);
      expect(decoded.action).toBe('registerUser');
    });

    it('should throw error when JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;

      expect(() => genVerificationToken(mockPayload)).toThrow(
        errors.JWT_SECRET_NOT_DEFINED,
      );
    });

    it('should generate token with 1 day expiration', () => {
      const token = genVerificationToken(mockPayload);
      const decoded = jwt.decode(token) as { exp: number };

      // 現在時刻から1日後のタイムスタンプを計算
      const oneDayFromNow = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

      // 許容誤差を1分（60秒）に設定
      expect(Math.abs(decoded.exp - oneDayFromNow)).toBeLessThan(60);
    });

    it('should accept userId in payload', () => {
      const payloadWithUserId: IVerificationTokenPayload = {
        ...mockPayload,
        userId: mockUserId,
      };

      const token = genVerificationToken(payloadWithUserId);
      const decoded = jwt.decode(token) as IVerificationTokenPayload;

      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.email).toBe(mockEmail);
      expect(decoded.action).toBe('registerUser');
    });

    it('should accept different action types', () => {
      const actions: Array<'registerUser' | 'changeEmail' | 'forgotPassword'> =
        ['registerUser', 'changeEmail', 'forgotPassword'];

      actions.forEach((action) => {
        const payload: IVerificationTokenPayload = {
          ...mockPayload,
          action,
        };
        const token = genVerificationToken(payload);
        const decoded = jwt.decode(token) as IVerificationTokenPayload;

        expect(decoded.action).toBe(action);
      });
    });
  });
});
