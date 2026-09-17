import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiResponse } from '../src/utils/apiResponse.js';

describe('ApiResponse', () => {
  it('marks <400 as success', () => {
    const r = new ApiResponse(200, { a: 1 }, 'ok');
    assert.equal(r.success, true);
    assert.equal(r.statusCode, 200);
  });

  it('marks >=400 as failure', () => {
    const r = new ApiResponse(500, null, 'Something went wrong!');
    assert.equal(r.success, false);
  });
});
