import { z } from 'zod';

import { ApiError, type ApiSuccess } from '@/types/api';

const metaSchema = z.object({
  cachedAt: z.string(),
  requestId: z.string(),
  stale: z.boolean(),
});

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    retryable: z.boolean(),
  }),
});

export async function requestApi<T>(
  path: string,
  dataSchema: z.ZodType<T>,
  init?: RequestInit,
): Promise<ApiSuccess<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const headers = new Headers(init?.headers);
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    const response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers,
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const failure = errorSchema.safeParse(payload);
      if (failure.success) {
        throw new ApiError(failure.data.error.message, {
          code: failure.data.error.code,
          requestId: failure.data.error.requestId,
          retryable: failure.data.error.retryable,
          status: response.status,
        });
      }
      throw new ApiError('服务暂时不可用。', {
        code: 'invalid-response',
        requestId: 'unknown',
        retryable: true,
        status: response.status,
      });
    }

    const parsed = z.object({ data: dataSchema, meta: metaSchema }).safeParse(payload);
    if (!parsed.success) {
      throw new ApiError('服务返回了无法识别的数据。', {
        code: 'invalid-response',
        requestId: 'unknown',
        retryable: true,
        status: response.status,
      });
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof DOMException && error.name === 'AbortError'
        ? '请求超时。'
        : '网络连接失败。',
      {
        code:
          error instanceof DOMException && error.name === 'AbortError'
            ? 'timeout'
            : 'network-error',
        requestId: 'client',
        retryable: true,
        status: 0,
      },
    );
  } finally {
    window.clearTimeout(timeout);
  }
}
