import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app';
import { errorHandler } from '../middleware/errorHandler.middleware';
import { notFoundHandler } from '../middleware/notFound';

describe('hackathon app error handling', () => {
  it('returns 404 JSON for unknown routes', async () => {
    const app = createApp();
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: 'Route GET /api/does-not-exist not found',
      path: '/api/does-not-exist',
    });
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns structured JSON for handler exceptions', async () => {
    const app = createApp({ includeErrorHandlers: false });
    app.get('/api/force-error', () => {
      throw new Error('forced failure');
    });
    app.use(notFoundHandler);
    app.use(errorHandler);

    const res = await request(app).get('/api/force-error');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('AppError');
    expect(res.body.message).toBe('forced failure');
    expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
