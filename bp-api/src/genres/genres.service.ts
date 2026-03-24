import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Genre } from "../entities/genre.entity";
import { GenreDto } from "./dto/genre.dto";
import { CreateGenreDto } from "./dto/create-genre.dto";
import { UpdateGenreDto } from "./dto/update-genre.dto";
import { ListGenresQueryDto } from "./dto/list-genres-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
  ) {}

  async findAll(dto: ListGenresQueryDto): Promise<PaginatedResult<GenreDto>> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const ALLOWED_SORT: Record<string, string> = {
      name:      "g.name",
      createdAt: "g.createdAt",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "g.name";
    const sortDir = dto.sortDir ?? "ASC";

    const qb = this.genreRepo.createQueryBuilder("g");

    if(dto.name)
      qb.andWhere("g.name LIKE :name", { name: `%${dto.name}%` });

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [genres, total] = await qb.getManyAndCount();

    return {
      data: genres.map(GenreDto.fromEntity),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<GenreDto> {
    const genre = await this.genreRepo.findOne({ where: { id } });

    if(!genre)
      throw new NotFoundException("Genre not found");

    return GenreDto.fromEntity(genre);
  }

  async create(dto: CreateGenreDto): Promise<GenreDto> {
    const existing = await this.genreRepo.findOne({ where: { name: dto.name } });

    if(existing)
      throw new ConflictException("Genre with this name already exists");

    const genre = this.genreRepo.create({ name: dto.name });
    const saved = await this.genreRepo.save(genre);

    return GenreDto.fromEntity(saved);
  }

  async update(id: number, dto: UpdateGenreDto): Promise<GenreDto> {
    const genre = await this.genreRepo.findOne({ where: { id } });

    if(!genre)
      throw new NotFoundException("Genre not found");

    if(dto.name !== undefined) {
      const conflict = await this.genreRepo.findOne({ where: { name: dto.name } });

      if(conflict && conflict.id !== id)
        throw new ConflictException("Genre with this name already exists");

      genre.name = dto.name;
    }

    const saved = await this.genreRepo.save(genre);

    return GenreDto.fromEntity(saved);
  }

  async remove(id: number): Promise<void> {
    const genre = await this.genreRepo.findOne({ where: { id } });

    if(!genre)
      throw new NotFoundException("Genre not found");

    await this.genreRepo.delete(id);
  }
}
