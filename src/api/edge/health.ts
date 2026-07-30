import { createRequestId, success } from './shared.ts';

export function handleHealthGet() {
  return success({ status: 'ok' }, createRequestId(), {
    headers: { 'cache-control': 'no-store' },
  });
}
