import { Role } from "../../entities/role.enum";
import { User } from "../../entities/user.entity";

export class AuthUserDto {
  id!:              number;
  email!:           string;
  displayName!:     string;
  profileImageUrl?: string | null;
  role!:            Role;
  roles!:           Role[];

  static fromEntity(user: User): AuthUserDto {
    const dto = new AuthUserDto();
    dto.id              = user.id;
    dto.email           = user.email;
    dto.displayName     = user.displayName;
    dto.profileImageUrl = user.profileImageUrl ?? null;
    dto.roles           = (user.roles ?? []).map((r) => r.role);
    dto.role            = pickPrimaryRole(user.roles);
    return dto;
  }
}

function pickPrimaryRole(roles: { role: Role }[] | undefined): Role {
  const set = new Set((roles ?? []).map((r) => r.role));
  if(set.has(Role.ADMIN))
    return Role.ADMIN;
  if(set.has(Role.ARTIST))
    return Role.ARTIST;

  return Role.LISTENER;
}