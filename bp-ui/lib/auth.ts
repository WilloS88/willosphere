export type Role = "listener" | "artist" | "admin";

export type UserRole = {
  role: Role;
};

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
  roles: UserRole[];
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export const getRoleRedirect = (user: AuthUser | null, locale: string) => {
  if (!user)
    return `/${locale}`;

  const roles = user.roles?.map((entry) => entry.role) ?? [];

  if (roles.includes("admin"))
    return `/${locale}/adminDashboard`;

  if (roles.includes("artist"))
    return `/${locale}/artistDashboard`;

  return `/${locale}`;
};
