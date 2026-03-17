import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL:          "/api",
  withCredentials:  true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
