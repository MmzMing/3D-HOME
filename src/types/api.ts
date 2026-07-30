export interface ApiMeta {
  cachedAt: string;
  requestId: string;
  stale: boolean;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiFailureBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    retryable: boolean;
  };
}

export class ApiError extends Error {
  readonly code: string;
  readonly requestId: string;
  readonly retryable: boolean;
  readonly status: number;

  constructor(
    message: string,
    options: { code: string; requestId: string; retryable: boolean; status: number },
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code;
    this.requestId = options.requestId;
    this.retryable = options.retryable;
    this.status = options.status;
  }
}
