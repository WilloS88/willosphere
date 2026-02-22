import { Role } from "@/app/types/user";

export type AuthUser = {
  id:           number;
  email:        string;
  displayName:  string;
  roles:        Role[];
};

export type AuthSession = {
  user:         AuthUser;
  accessToken:  string;
  refreshToken: string;
};

export const getRoleRedirect = (user: AuthUser | null, locale: string) => {
  if(!user)
    return `/${locale}`;

  const roles = user.roles?.map((entry) => entry) ?? [];

  if(roles.includes("admin"))
    return `/${locale}/admin`;

  if(roles.includes("artist"))
    return `/${locale}/artist`;

  return `/${locale}`;
};
