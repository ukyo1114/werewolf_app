import request from 'supertest';
import app from '../src/app';

describe('Server Startup Test', () => {
  it('should respond with 200 status on root path', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});
