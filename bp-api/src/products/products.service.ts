import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../entities/product.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { ProductDto } from "./dto/product.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ListProductsQueryDto } from "./dto/list-products-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ArtistProfile)
    private readonly artistRepo: Repository<ArtistProfile>,
  ) {}

  private baseQuery() {
    return this.productRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.artist", "ap")
      .leftJoinAndSelect("ap.user",  "u")
      .leftJoinAndSelect("p.track",  "t")
      .leftJoinAndSelect("p.album",  "a");
  }

  async findAll(dto: ListProductsQueryDto): Promise<PaginatedResult<ProductDto>> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const ALLOWED_SORT: Record<string, string> = {
      id:        "p.id",
      name:      "p.name",
      price:     "p.price",
      createdAt: "p.createdAt",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "p.createdAt";
    const sortDir = dto.sortDir ?? "DESC";

    const qb = this.baseQuery();

    if(dto.name)
      qb.andWhere("p.name LIKE :name", { name: `%${dto.name}%` });

    if(dto.artistId)
      qb.andWhere("p.artistId = :artistId", { artistId: dto.artistId });

    if(dto.type)
      qb.andWhere("p.type = :type", { type: dto.type });

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [products, total] = await qb.getManyAndCount();

    return {
      data: products.map(ProductDto.fromEntity),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<ProductDto> {
    const product = await this.baseQuery()
      .where("p.id = :id", { id })
      .getOne();

    if(!product)
      throw new NotFoundException("Product not found");

    return ProductDto.fromEntity(product);
  }

  async create(dto: CreateProductDto): Promise<ProductDto> {
    await this.validateArtistId(dto.artistId);

    const product = this.productRepo.create({
      name:        dto.name,
      type:        dto.type,
      description: dto.description ?? null,
      price:       String(dto.price),
      artistId:    dto.artistId,
      trackId:     dto.trackId ?? null,
      albumId:     dto.albumId ?? null,
    });

    const saved = await this.productRepo.save(product);

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductDto> {
    const product = await this.productRepo.findOne({ where: { id } });

    if(!product)
      throw new NotFoundException("Product not found");

    if(dto.artistId !== undefined)
      await this.validateArtistId(dto.artistId);

    if (dto.name        !== undefined) product.name         = dto.name;
    if (dto.type        !== undefined) product.type         = dto.type;
    if (dto.description !== undefined) product.description  = dto.description;
    if (dto.price       !== undefined) product.price        = String(dto.price);
    if (dto.artistId    !== undefined) product.artistId     = dto.artistId;
    if (dto.trackId     !== undefined) product.trackId      = dto.trackId ?? null;
    if (dto.albumId     !== undefined) product.albumId      = dto.albumId ?? null;

    await this.productRepo.save(product);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });

    if(!product)
      throw new NotFoundException("Product not found");

    try {
      await this.productRepo.delete(id);
    } catch (e: any) {
      if(e?.code === "ER_ROW_IS_REFERENCED_2")
        throw new BadRequestException("Cannot delete product that has already been purchased");
      throw e;
    }
  }

  private async validateArtistId(artistId: number): Promise<void> {
    const artist = await this.artistRepo.findOne({ where: { userId: artistId } });

    if(!artist)
      throw new BadRequestException(`Artist profile not found for id: ${artistId}`);
  }
}
