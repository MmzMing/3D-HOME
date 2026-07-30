import { handleFeedsGet } from './feeds.ts';
import { handleGithubGet } from './github.ts';
import { handleHealthGet } from './health.ts';
import { handleMusicGet } from './music.ts';
import { createRequestId, failure, type EdgeContext } from './shared.ts';
import { handleWeatherGet, handleWeatherPost } from './weather.ts';

type EdgeHandler = (context: EdgeContext) => Response | Promise<Response>;

const routes: Readonly<Record<string, Readonly<Partial<Record<string, EdgeHandler>>>>> = {
  '/api/feeds': { GET: handleFeedsGet },
  '/api/github': { GET: handleGithubGet },
  '/api/health': { GET: handleHealthGet },
  '/api/music': { GET: handleMusicGet },
  '/api/weather': { GET: handleWeatherGet, POST: handleWeatherPost },
};

export function dispatchApiRequest(context: EdgeContext): Response | Promise<Response> {
  const pathname = new URL(context.request.url).pathname;
  const route = routes[pathname];
  const handler = route?.[context.request.method.toUpperCase()];

  if (handler !== undefined) return handler(context);

  const methodNotAllowed = route !== undefined;
  return failure(
    methodNotAllowed ? 'method-not-allowed' : 'not-found',
    methodNotAllowed ? '请求方法不受支持。' : '请求的接口不存在。',
    createRequestId(),
    false,
    methodNotAllowed ? 405 : 404,
  );
}
