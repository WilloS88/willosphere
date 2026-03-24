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

  tracks: {
    list:   "/tracks",
    detail: (id: number) => `/tracks/${id}`,
  },

  genres: {
    list:   "/genres",
    detail: (id: number) => `/genres/${id}`,
  },

  adminTracks: {
    list:   "/admin/tracks",
    detail: (id: number) => `/admin/tracks/${id}`,
  },

  adminGenres: {
    list:   "/admin/genres",
    detail: (id: number) => `/admin/genres/${id}`,
  },

  albums: {
    list:   "/albums",
    detail: (id: number) => `/albums/${id}`,
  },

  adminAlbums: {
    list:   "/admin/albums",
    detail: (id: number) => `/admin/albums/${id}`,
  },

  playlists: {
    list:         "/playlists",
    detail:       (id: number) => `/playlists/${id}`,
    tracks:       (id: number) => `/playlists/${id}/tracks`,
    removeTrack:  (id: number, trackId: number) => `/playlists/${id}/tracks/${trackId}`,
  },

  adminPlaylists: {
    list:   "/admin/playlists",
    detail: (id: number) => `/admin/playlists/${id}`,
  },
} as const;
