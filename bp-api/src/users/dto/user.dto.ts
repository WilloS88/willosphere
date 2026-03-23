import { Role } from "../../entities/role.enum";
import { User } from "../../entities/user.entity";
import { ArtistProfile } from "../../entities/artist-profile.entity";

export class UserDTO {
    id!:            number;
    email!:         string;
    displayName!:   string;
    role!:          Role;
    roles!:         Role[];

    static fromEntity(u: User): UserDTO {
        const dto       = new UserDTO();
        dto.id          = u.id;
        dto.email       = u.email;
        dto.displayName = u.displayName;
        dto.roles       = (u.roles ?? []).map(r => r.role);
        dto.role        = pickPrimaryRole(u.roles);
        return dto;
    }
}

function pickPrimaryRole(roles: { role: Role }[] | undefined): Role {
    const set = new Set((roles ?? []).map(r => r.role));
    if(set.has(Role.ADMIN))
        return Role.ADMIN;
    if(set.has(Role.ARTIST))
        return Role.ARTIST;
    return Role.LISTENER;
}

export class UserDetailDTO extends UserDTO {
    timezone!:          string;
    language!:          string;
    profileImageUrl?:   string | null;
    createdAt!:         Date;
    updatedAt!:         Date;
    artistProfile?:     ArtistProfile | null;

    static fromEntity(u: User): UserDetailDTO {
        const dto = new UserDetailDTO();
        Object.assign(dto, UserDTO.fromEntity(u));

        dto.timezone        = u.timezone;
        dto.language        = u.language;
        dto.profileImageUrl = u.profileImageUrl ?? null;
        dto.createdAt       = u.createdAt;
        dto.updatedAt       = u.updatedAt;
        dto.artistProfile   = u.artistProfile ?? null;
        return dto;
    }
}
