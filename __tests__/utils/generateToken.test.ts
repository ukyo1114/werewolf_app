import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  IVerificationTokenPayload,
  genUserToken,
  genVerificationToken,
} from '../../src/utils/generateToken';

dotenv.config({ path: '.env.test' });

describe('test genUserToken', () => {
  const testSecret = process.env.JWT_SECRET;
  if (!testSecret) {
    throw new Error('JWT_SECRET is not defined in test environment.');
  }

  test('トークンを生成', () => {
    const userId = 'test';
    const token = genUserToken('test');

    const decoded = jwt.verify(token, testSecret) as jwt.JwtPayload;
    expect(decoded.userId).toBe(userId);
    expect(decoded.exp).toBeDefined();
  });
});

describe('test genVerificationToken', () => {
  const testSecret = process.env.JWT_SECRET;
  if (!testSecret) {
    throw new Error('JWT_SECRET is not defined in test environment.');
  }

  test('トークンを生成', () => {
    const payload: IVerificationTokenPayload = {
      userId: 'test',
      email: 'test@example.com',
      action: 'registerUser',
    };
    const token = genVerificationToken(payload);

    const decoded = jwt.verify(token, testSecret) as jwt.JwtPayload;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.action).toBe(payload.action);
    expect(decoded.exp).toBeDefined();
  });
});
