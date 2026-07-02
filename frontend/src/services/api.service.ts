import axios, { AxiosResponse } from 'axios';

// ─── Base Instance ─────────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: '/server/sample_node_js_function',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // Attach auth token here if needed in future
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let message =
      'A small error has occurred, causing an interruption of service. Please try again.';

    console.error('API Error:\n', error);

    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      message =
        "We're having trouble connecting to the network. Please try again later.";
      return Promise.reject(new Error(message));
    }

    if (error && error.response) {
      const errResp: AxiosResponse = error.response;

      if (errResp && errResp.data) {
        // Extract server-provided message if available
        if (errResp.data.message) {
          message = errResp.data.message;
        } else if (errResp.data.error) {
          message = errResp.data.error;
        }

        // Handle session expiry (440)
        if (errResp.data.statusCode === 440) {
          console.warn('Session expired. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }

        // Handle maintenance mode (503)
        if (errResp.data.statusCode === 503) {
          console.warn('Service unavailable. Redirecting...');
          setTimeout(() => {
            window.location.href = '/under-maintenance';
          }, 1500);
        }
      }
    }

    return Promise.reject(new Error(message));
  }
);

export interface CatalystRow {
  ROWID: string;
  Title: string;
  Description: string;
  Completed: boolean;
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string;
  completed?: boolean;
}


export const APIGetTodos = async (): Promise<AxiosResponse<CatalystRow[] | { data: CatalystRow[] }>> => {
  return axiosInstance.get('/todos');
};

export const APICreateTodo = async (
  payload: CreateTodoPayload
): Promise<AxiosResponse> => {
  return axiosInstance.post('/todos', payload);
};

export const APIUpdateTodo = async (
  id: string,
  payload: UpdateTodoPayload
): Promise<AxiosResponse> => {
  return axiosInstance.post(`/todos/${id}`, payload);
};

export const APIDeleteTodo = async (id: string): Promise<AxiosResponse> => {
  return axiosInstance.delete(`/todos/${id}`);
};
