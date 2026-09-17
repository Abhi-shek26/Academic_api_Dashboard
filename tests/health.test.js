import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('health endpoints (no DB required)', () => {
  let server;
  let base;
  let app;

  before(async () => {
    process.env.PORT = process.env.PORT || '3998';
    ({ default: app } = await import('../src/app.js'));
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => new Promise((resolve) => server.close(resolve)));

  it('GET /health returns 200', async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  it('GET / returns 200 (Render health check)', async () => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
  });

  it('unknown route returns 404 JSON', async () => {
    const res = await fetch(`${base}/no-such-route`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
