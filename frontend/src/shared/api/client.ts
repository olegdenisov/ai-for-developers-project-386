const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return fetch(url.toString()).then(handleResponse<T>);
  },

  post: <T>(endpoint: string, data: unknown): Promise<T> => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(handleResponse<T>);
  },

  put: <T>(endpoint: string, data: unknown): Promise<T> => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(handleResponse<T>);
  },

  delete: <T>(endpoint: string): Promise<T> => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    }).then(handleResponse<T>);
  },
};