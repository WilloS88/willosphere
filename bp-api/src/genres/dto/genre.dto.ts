import { Genre } from "../../entities/genre.entity";

export class GenreDto {
  id!:        number;
  name!:      string;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(genre: Genre): GenreDto {
    const dto       = new GenreDto();
    dto.id          = genre.id;
    dto.name        = genre.name;
    dto.createdAt   = genre.createdAt;
    dto.updatedAt   = genre.updatedAt;
    return dto;
  }
}
