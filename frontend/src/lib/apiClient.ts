export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let errorMessage = 'API Error';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export const simulateNetworkCall = <T>(data: T, delay: number, errorMsg: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 3;
    const SIMULATE_ERRORS = false;

    const attemptCall = () => {
      setTimeout(() => {
        attempts++;
        if (SIMULATE_ERRORS && Math.random() < 0.25) {
          if (attempts < maxAttempts) {
            console.warn(`Intento ${attempts} fallido. Reintentando por red inestable... (${errorMsg})`);
            attemptCall();
          } else {
            console.error(`Todos los ${maxAttempts} intentos fallaron.`);
            reject(new Error(errorMsg));
          }
        } else {
          resolve(data);
        }
      }, delay * (attempts === 0 ? 1 : 1.5));
    };

    attemptCall();
  });
};
