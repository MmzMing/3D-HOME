import { describe, expect, it } from 'vitest';

import { dispatchApiRequest } from '@/api/edge/router';
import type { EdgeContext } from '@/api/edge/shared';

function context(path: string, method = 'GET'): EdgeContext {
  return {
    env: {},
    request: new Request(`https://example.com${path}`, { method }),
    waitUntil: () => undefined,
  };
}

describe('edge API router', () => {
  it('dispatches a known route', async () => {
    const response = await dispatchApiRequest(context('/api/health'));
    const payload: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ data: { status: 'ok' } });
  });

  it('returns a structured method error for a known route', async () => {
    const response = await dispatchApiRequest(context('/api/health', 'POST'));
    const payload: unknown = await response.json();

    expect(response.status).toBe(405);
    expect(payload).toMatchObject({ error: { code: 'method-not-allowed', retryable: false } });
  });

  it('returns a structured not-found error for an unknown route', async () => {
    const response = await dispatchApiRequest(context('/api/unknown'));
    const payload: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toMatchObject({ error: { code: 'not-found', retryable: false } });
  });

  it('dispatches GitHub requests to the provider handler', async () => {
    const response = await dispatchApiRequest(context('/api/github'));
    const payload: unknown = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({ error: { code: 'provider-unavailable' } });
  });
});
