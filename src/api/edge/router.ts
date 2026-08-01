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

const STATIC_ASSET_REGEX = /\.(?:js|mjs|css|png|jpe?g|gif|svg|ico|woff2?|ttf|mp3|mp4|webp)$/i;

export function dispatchApiRequest(context: EdgeContext): Response | Promise<Response> {
  const pathname = new URL(context.request.url).pathname;

  // 1. 双保险：如果请求的是静态资源（带扩展名），或者根本不是 /api/ 开头，
  //    直接返回空响应，通知 EdgeOne 回退到静态资源服务（或 SPA fallback）。
  //    这可以防止因路由配置错误导致边缘函数误拦截静态资源。
  if (!pathname.startsWith('/api/') || STATIC_ASSET_REGEX.test(pathname)) {
    // 抛出一个特殊的错误，边缘函数可能会将其解释为"跳过处理"，
    // 或者返回 500，但我们更倾向于让静态资源服务或 SPA fallback 接管。
    // 在 EdgeOne 中，返回空 Response 或抛出异常通常会触发 CDN 回退。
    return new Response(null, { status: 404 });
  }

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
