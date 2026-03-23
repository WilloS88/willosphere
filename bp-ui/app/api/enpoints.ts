export const API_ENDPOINTS = {
  auth: {
    signup:        "/auth/signup",
    signupArtist:  "/auth/signup-artist",
    login:         "/auth/login",
    logout:        "/auth/logout",
    refresh:       "/auth/refresh",
    me:            "/auth/me",
  },

  admin: {
    users:        "/admin/users",
    userDetail:   (id: number) => `/admin/users/${id}`,
    artists:      "/admin/artists",
    artistDetail: (id: number) => `/admin/artists/${id}`,
  },

  artists: {
    list:     "/artists",
    become:   "/artists/become",
    me:       "/artists/me",
    detail:   (id: number) => `/artists/${id}`,
  },
} as const;
