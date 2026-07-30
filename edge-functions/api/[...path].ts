import { dispatchApiRequest } from '../../src/api/edge/router';
import type { EdgeContext } from '../../src/api/edge/shared';

export async function onRequestGet(context: EdgeContext): Promise<Response> {
  return dispatchApiRequest(context);
}

export async function onRequestPost(context: EdgeContext): Promise<Response> {
  return dispatchApiRequest(context);
}
