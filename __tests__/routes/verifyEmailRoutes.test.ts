jest.mock('../../src/controllers/verifyEmailController/utils', () => ({
  ...jest.requireActual('../../src/controllers/verifyEmailController/utils'),
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import express from 'express';
import verifyEmailRoutes from '../../src/routes/verifyEmailRoutes';
import User from '../../src/models/userModel';
import { errors } from '../../src/config/messages';
// import { validation } from '../../src/config/messages';

jest.mock('../../src/models/userModel');

const app = express();
app.use(express.json());
app.use(verifyEmailRoutes);

describe('POST /register-user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 202 when email is valid', async () => {
    (User.exists as jest.Mock).mockResolvedValue(false);

    const response = await request(app)
      .post('/register-user')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({});
  });

  it('should return 400 when email is already registered', async () => {
    (User.exists as jest.Mock).mockResolvedValue(true);

    const response = await request(app)
      .post('/register-user')
      .send({ email: 'test@example.com' });

    // console.log(response);

    expect(response.status).toBe(400);
    // expect(response.body.message).toBe(errors.EMAIL_ALREADY_REGISTERED);
    expect(User.exists).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('should return 400 when email is invalid', async () => {
    const response = await request(app)
      .post('/register-user')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    /*     expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: validation.INVALID_EMAIL,
        }),
      ]),
    ); */
  });

  it('should return 400 when email is missing', async () => {
    const response = await request(app).post('/register-user').send({});

    expect(response.status).toBe(400);
    /*     expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: validation.INVALID_EMAIL,
        }),
      ]),
    ); */
  });
});
