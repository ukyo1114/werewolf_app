import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../src/models/userModel';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // データベースを初期化
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('User Model Test', () => {
  it('should create a User successfully', async () => {
    const userData = {
      user_name: 'testuser',
      email: 'test@example.com',
      password: 'securepassword',
    };

    const user = await User.create(userData);

    expect(user.user_name).toBe(userData.user_name);
    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password); // パスワードはハッシュ化されている
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('should fail to create a User without required fields', async () => {
    const invalidData = {};

    await expect(User.create(invalidData)).rejects.toThrow();
  });

  it('should validate email format', async () => {
    const invalidEmailData = {
      email: 'invalid-email',
      password: 'securepassword',
    };

    await expect(User.create(invalidEmailData)).rejects.toThrow();
  });
});
