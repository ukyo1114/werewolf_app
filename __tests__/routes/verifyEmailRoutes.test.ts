jest.mock('../../src/controllers/verifyEmail/utils', () => ({
  ...jest.requireActual('../../src/controllers/verifyEmail/utils'),
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import express from 'express';
import verifyEmailRoutes from '../../src/routes/verifyEmailRoutes';
// import { validation } from '../../src/config/messages';

const app = express();
app.use(express.json());
app.use(verifyEmailRoutes);

describe('POST /register-user', () => {
  it('should return 202 when email is valid', async () => {
    const response = await request(app)
      .post('/register-user')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({});
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