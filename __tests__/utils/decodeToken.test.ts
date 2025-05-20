import jwt from 'jsonwebtoken';
import { decodeToken } from '../../src/utils/decodeToken';
import { errors } from '../../src/config/messages';

describe('decodeToken', () => {
  const mockSecret = 'test-secret';
  const mockPayload = {
    email: 'test@example.com',
    action: 'registerUser',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = mockSecret;
  });

  it('should decode a valid token', () => {
    const token = jwt.sign(mockPayload, mockSecret);
    const decoded = decodeToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.action).toBe(mockPayload.action);
  });

  it('should throw error for invalid token', () => {
    const invalidToken = 'invalid.token.here';

    expect(() => decodeToken(invalidToken)).toThrow(errors.INVALID_TOKEN);
  });

  it('should throw error when JWT_SECRET is not defined', () => {
    delete process.env.JWT_SECRET;

    const token = jwt.sign(mockPayload, mockSecret);

    expect(() => decodeToken(token)).toThrow(errors.JWT_SECRET_NOT_DEFINED);
  });

  it('should throw error for expired token', async () => {
    const token = jwt.sign(mockPayload, mockSecret, { expiresIn: '1s' });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(() => decodeToken(token)).toThrow(errors.INVALID_TOKEN);
  }, 10000);

  it('should throw error for malformed token', () => {
    const malformedToken = 'header.payload'; // 署名部分が欠けている

    expect(() => decodeToken(malformedToken)).toThrow(errors.INVALID_TOKEN);
  });

  it('should throw error for token with invalid signature', () => {
    const token = jwt.sign(mockPayload, 'wrong-secret');

    expect(() => decodeToken(token)).toThrow(errors.INVALID_TOKEN);
  });

  it('should throw error for empty token', () => {
    expect(() => decodeToken('')).toThrow(errors.INVALID_TOKEN);
  });

  it('should throw error for null token', () => {
    expect(() => decodeToken(null as any)).toThrow(errors.INVALID_TOKEN);
  });
});
