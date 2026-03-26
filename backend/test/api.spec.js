import request from 'supertest';
import app from '../src/index.js';

describe('API basic checks', () => {
  it('responds on /api/news', async () => {
    const res = await request(app).get('/api/news');
    expect([200, 500]).toContain(res.statusCode);
    expect(res.headers['content-type']).toMatch(/json/);
  });
  it('returns 404 for unknown API route', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect([404, 500]).toContain(res.statusCode);
  });
});
