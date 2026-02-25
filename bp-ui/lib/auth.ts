import { Role } from "@/app/types/user";

export type UserRole =
  | Role
  | {
  role: Role;
};

export type AuthUser = {
  id:           number;
  email:        string;
  displayName:  string;
  roles:        UserRole[];
};

export type AuthSession = {
  user:         AuthUser;
  accessToken:  string;
  refreshToken: string;
};

export const getUserRoleNames = (roles: AuthUser["roles"] | undefined): Role[] => {
  if(!roles)
    return [];

  return roles
    .map((entry) => (typeof entry === "string" ? entry : entry.role))
    .filter((role): role is Role => role === "listener" || role === "artist" || role === "admin");
};

export const hasRole = (user: AuthUser | null | undefined, role: Role) =>
  getUserRoleNames(user?.roles).includes(role);

export const getRoleRedirect = (user: AuthUser | null, locale: string) => {
  if(!user)
    return `/${locale}`;

  const roles = getUserRoleNames(user.roles);

  if(roles.includes("admin"))
    return `/${locale}/admin`;

  if(roles.includes("artist"))
    return `/${locale}/artist`;

  return `/${locale}`;
};
