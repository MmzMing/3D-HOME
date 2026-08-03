import { handleRobotsGet } from '../src/api/edge/seo';
import type { EdgeContext } from '../src/api/edge/shared';

export function onRequestGet(context: EdgeContext): Response {
  return handleRobotsGet(context);
}
