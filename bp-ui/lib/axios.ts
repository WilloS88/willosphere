import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL:          "/api",
  withCredentials:  true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as typeof err.config & { _retry?: boolean };

    if(err.response?.status === 401 && !original?._retry) {
      original._retry = true;

      if(!refreshing) {
        refreshing = axios
          .post("/api/auth/refresh", null, { withCredentials: true })
          .then(() => { refreshing = null; })
          .catch(() => { refreshing = null; });
      }
      try {
        await refreshing;
        return api(original);
      }
      catch {
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const parseAxiosError = (err: unknown): string => {
  if(axios.isAxiosError(err)) {
    const msg = (err as AxiosError<{ message: string | string[] }>).response?.data?.message;
    
    if(Array.isArray(msg))
      return msg.join(", ");

    if(typeof msg === "string")
      return msg;
    
    return `Request failed (${err.response?.status ?? "unknown"})`;
  }
  return "Unknown error";
};
