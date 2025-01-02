import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';

import User from '../../src/models/userModel';
import { errors } from '../../src/config/messages';

let mongoServer: MongoMemoryServer;

describe('POST /register (registerUser)', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('should register a new user when valid token is provided', async () => {
    const validToken = 'validMockToken';

    const response = await request(app).post('/user/register-user').send({
      userName: 'testuser',
      password: 'P@ssw0rd',
      token: validToken,
    });

    expect(response.status).toBe(201);

    const createdUser = await User.findOne({ user_name: 'testuser' });
    expect(createdUser).toBeTruthy();
    expect(createdUser?.email).toBe('test@example.com');
  });

  /*   it('should fail if token is invalid', async () => {
    const invalidToken = 'invalidToken';

    const response = await request(app).post('/register').send({
      userName: 'testuser',
      password: 'P@ssw0rd',
      token: invalidToken,
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe(errors.INVALID_TOKEN);
  }); */

  /*   it('should fail if email is already registered', async () => {
    await User.create({
      user_name: 'existingUser',
      email: 'existing@example.com',
      password: 'hashedPassword',
    });

    const tokenWithExistingEmail = 'tokenThatDecodesToExisting@example.com';

    const response = await request(app).post('/register').send({
      userName: 'anotherUser',
      password: 'P@ssw0rd',
      token: tokenWithExistingEmail,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(errors.EMAIL_ALREADY_REGISTERED);
  }); */
});
