export const API_ENDPOINTS = {
  auth: {
    signup:        "/auth/signup",
    signupArtist:  "/auth/signup-artist",
    login:         "/auth/login",
    verifyLogin:   "/auth/verify-login",
    logout:        "/auth/logout",
    refresh:       "/auth/refresh",
    me:            "/auth/me",
  },

  mfa: {
    enroll:        "mfa/enroll",
    confirm:       "mfa/confirm",
    status:        "mfa/status",
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

  products: {
    list:   "/products",
    detail: (id: number) => `/products/${id}`,
  },

  adminProducts: {
    list:   "/admin/products",
    detail: (id: number) => `/admin/products/${id}`,
  },

  purchases: {
    list:   "/purchases",
    detail: (id: number) => `/purchases/${id}`,
    create: "/purchases",
  },

  adminStats: {
    stats: "/admin/stats",
  },

  landing: {
    data: "/landing",
  },

  donations: {
    create:  "/donations",
    myTotal: "/donations/my-total",
  },

  listenHistory: {
    record: "/listen-history",
    list:   "/listen-history",
  },

  engagementActions: {
    record: "/engagement-actions",
    likes:  "/engagement-actions/likes",
    unlike: (trackId: number) => `/engagement-actions/likes/${trackId}`,
  },

  adminRoyalties: {
    calculate:  "/admin/royalties/calculate",
    list:       "/admin/royalties",
    artist:     (id: number) => `/admin/royalties/artist/${id}`,
  },

  algorithmConfig: {
    list:   "/admin/algorithm-config",
    update: (key: string) => `/admin/algorithm-config/${key}`,
  },
  search: {
    query: "/search",
  },
} as const;
