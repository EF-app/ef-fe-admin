import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  timeout?: number;
}

/**
 * 플랫폼별(웹/앱)로 토큰 저장소가 다르기 때문에 getToken 주입 방식 사용.
 * 웹: localStorage, 앱: AsyncStorage 또는 SecureStore.
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(async (req: InternalAxiosRequestConfig) => {
    if (config.getToken) {
      const token = await config.getToken();
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
    return req;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error?.response?.status;
      if (status === 401 && config.onUnauthorized) {
        config.onUnauthorized();
      }
      return Promise.reject(normalizeError(error));
    }
  );

  return instance;
}

export interface NormalizedError {
  status: number;
  message: string;
  errorCode?: string;
  raw?: unknown;
}

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    const res = error.response;
    const data = res?.data as { message?: string; errorCode?: string } | undefined;
    return {
      status: res?.status ?? 0,
      message: data?.message ?? error.message ?? '요청에 실패했습니다.',
      errorCode: data?.errorCode,
      raw: error,
    };
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message, raw: error };
  }
  return { status: 0, message: '알 수 없는 오류', raw: error };
}

/** 싱글톤 인스턴스 — 플랫폼별 초기화 코드에서 setApiClient 호출 필수 */
let clientRef: AxiosInstance | null = null;

export function setApiClient(client: AxiosInstance) {
  clientRef = client;
}

export function getApiClient(): AxiosInstance {
  if (!clientRef) {
    throw new Error(
      '[shared/api] API client is not initialized. Call setApiClient() at app entry.'
    );
  }
  return clientRef;
}
