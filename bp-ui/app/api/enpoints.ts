const API_BASE_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

export const API_ENDPOINTS = {
  auth: {
    signup: `${API_BASE_URL}/auth/signup`,
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,
  },
} as const;
