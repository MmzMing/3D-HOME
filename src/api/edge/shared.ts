import { z } from 'zod';

export interface EdgeContext {
  env: Record<string, string | undefined>;
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

export interface EdgeGeo {
  city?: string | undefined;
  latitude: number;
  longitude: number;
  region?: string | undefined;
}

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

const localCache = new Map<string, Response>();

const edgeRequestSchema = z.object({
  eo: z
    .object({
      geo: z
        .object({
          city: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          region: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export function getEdgeGeo(request: Request): EdgeGeo | null {
  const parsed = edgeRequestSchema.safeParse(request);
  const geo = parsed.success ? parsed.data.eo?.geo : undefined;
  const latitude = geo?.latitude;
  const longitude = geo?.longitude;

  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { city: geo?.city, latitude, longitude, region: geo?.region };
}

export function getEdgeCache(): EdgeCache {
  const platformCache = (globalThis as { caches?: { default?: EdgeCache } }).caches?.default;
  if (platformCache !== undefined) return platformCache;

  return {
    match(request) {
      return Promise.resolve(localCache.get(request.url)?.clone());
    },
    put(request, response) {
      localCache.set(request.url, response.clone());
      return Promise.resolve();
    },
  };
}

export function createRequestId() {
  return crypto.randomUUID();
}

export function success(data: unknown, requestId: string, init?: ResponseInit) {
  const headers = new Headers(init?.headers ?? {});
  headers.set('content-type', 'application/json; charset=UTF-8');
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 's-maxage=900, stale-while-revalidate=3600');
  }

  return new Response(
    JSON.stringify({
      data,
      meta: { cachedAt: new Date().toISOString(), requestId, stale: false },
    }),
    { ...init, headers },
  );
}

export function failure(
  code: string,
  message: string,
  requestId: string,
  retryable: boolean,
  status: number,
) {
  return new Response(JSON.stringify({ error: { code, message, requestId, retryable } }), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=UTF-8',
    },
    status,
  });
}

export async function fetchWithTimeout(url: URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function isPublicHttpsUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return false;
  if (/^(0|10|127)\.|^169\.254\.|^172\.(1[6-9]|2\d|3[0-1])\.|^192\.168\./.test(hostname)) {
    return false;
  }
  if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd')) return false;
  return true;
}
