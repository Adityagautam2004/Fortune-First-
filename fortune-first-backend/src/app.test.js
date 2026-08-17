// puppeteer ships an ESM-only entry point that Jest's default CJS transform
// can't parse; these tests never touch PDF generation, so mock it out rather
// than dragging a real headless-browser dependency into an unrelated test.
jest.mock('./utils/pdf', () => ({ generateReportPDF: jest.fn() }));

const request = require('supertest');
const { app } = require('./app');
const db = require('./models/db');
const redis = require('./utils/redis');

afterAll(async () => {
  await db.pool.end();
  redis.disconnect();
});

describe('GET /api/v1/health', () => {
  test('reports success and a live DB timestamp', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.dbTime).toBeDefined();
  });
});

describe('unmatched routes', () => {
  test('return a JSON 404, not a bare Express HTML page', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

describe('POST /api/v1/auth/login', () => {
  test('rejects a request with no email/password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
