import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  genUserToken,
  genVerificationToken,
} from '../../src/utils/generateToken';

dotenv.config({ path: '.env.test' });

describe('Token Generation Tests', () => {
  const testJwtSecret = process.env.JWT_SECRET;
  if (!testJwtSecret) {
    throw new Error('JWT_SECRET is not defined in test environment.');
  }

  test('should generate a valid user token', () => {
    const userId = '12345';
    const token = genUserToken(userId);

    const decoded = jwt.verify(token, testJwtSecret) as jwt.JwtPayload;
    expect(decoded.userId).toBe(userId);
    expect(decoded.exp).toBeDefined();
  });

  test('should generate a valid verification token', () => {
    const payload = {
      userId: '67890',
      email: 'test@example.com',
      action: 'verifyEmail',
    };
    const token = genVerificationToken(payload);

    const decoded = jwt.verify(token, testJwtSecret) as jwt.JwtPayload;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.action).toBe(payload.action);
    expect(decoded.exp).toBeDefined();
  });

  test('should generate a valid verification token without userId', () => {
    const payload = {
      email: 'test@example.com',
      action: 'verifyEmail',
    };
    const token = genVerificationToken(payload);

    const decoded = jwt.verify(token, testJwtSecret) as jwt.JwtPayload;
    expect(decoded.userId).toBe(undefined);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.action).toBe(payload.action);
    expect(decoded.exp).toBeDefined();
  });
});
