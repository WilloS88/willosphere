export const API_ENDPOINTS = {
  auth: {
    signup:   "/auth/signup",
    login:    "/auth/login",
    logout:   "/auth/logout",
    refresh:  "/auth/refresh",
    me:       "/auth/me",
  },

  admin: {
    users:      "/admin/users",
    userDetail: (id: number) => `/admin/users/${id}`,
  },
} as const;
