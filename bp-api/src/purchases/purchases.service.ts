import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Purchase } from "../entities/purchase.entity";
import { PurchaseItem } from "../entities/purchase-item.entity";
import { Product } from "../entities/product.entity";
import { PurchaseDto } from "./dto/purchase.dto";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { ListPurchasesQueryDto } from "./dto/list-purchases-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { Role } from "../entities/role.enum";

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async create(userId: number, dto: CreatePurchaseDto): Promise<PurchaseDto> {
    const productIds = [...new Set(dto.items.map((i) => i.productId))];

    const products = await this.productRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.artist", "ap")
      .leftJoinAndSelect("ap.user",  "u")
      .whereInIds(productIds)
      .getMany();

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missing  = productIds.filter((id) => !foundIds.includes(id));
      throw new UnprocessableEntityException(`Products not found: ${missing.join(", ")}`);
    }

    const productMap  = new Map(products.map((p) => [p.id, p]));
    const totalPrice  = dto.items.reduce(
      (sum, item) => sum + parseFloat(productMap.get(item.productId)!.price),
      0,
    );

    const savedId = await this.ds.transaction(async (trx) => {
      const purchase = trx.getRepository(Purchase).create({
        userId,
        totalPrice:   totalPrice.toFixed(2),
        currencyCode: "CZK",
      });
      const saved = await trx.getRepository(Purchase).save(purchase);

      await trx.getRepository(PurchaseItem).save(
        dto.items.map((item) => ({
          purchaseId: saved.id,
          productId:  item.productId,
          price:      productMap.get(item.productId)!.price,
        })),
      );

      return saved.id;
    });

    return this.findOne(savedId, userId, []);
  }

  async findAll(
    userId: number,
    roles: Role[],
    dto: ListPurchasesQueryDto,
  ): Promise<PaginatedResult<PurchaseDto>> {
    const page    = dto.page  ?? 1;
    const limit   = dto.limit ?? 20;
    const isAdmin = roles.includes(Role.ADMIN);

    const qb = this.purchaseRepo
      .createQueryBuilder("pu")
      .leftJoinAndSelect("pu.items",    "pi")
      .leftJoinAndSelect("pi.product",  "prod")
      .leftJoinAndSelect("prod.artist", "ap")
      .leftJoinAndSelect("ap.user",     "u");

    if(!isAdmin)
      qb.where("pu.userId = :userId", { userId });

    if(dto.from)
      qb.andWhere("pu.purchaseDate >= :from", { from: dto.from });

    if(dto.to)
      qb.andWhere("pu.purchaseDate <= :to", { to: dto.to });

    if(isAdmin && dto.userId)
      qb.andWhere("pu.userId = :filterUserId", { filterUserId: dto.userId });

    const ALLOWED_SORT: Record<string, string> = {
      id:           "pu.id",
      purchaseDate: "pu.purchaseDate",
      totalPrice:   "pu.totalPrice",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "pu.purchaseDate";
    const sortDir = dto.sortDir ?? "DESC";

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [purchases, total] = await qb.getManyAndCount();

    return {
      data: purchases.map(PurchaseDto.fromEntity),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, userId: number, roles: Role[]): Promise<PurchaseDto> {
    const purchase = await this.purchaseRepo
      .createQueryBuilder("pu")
      .leftJoinAndSelect("pu.items",    "pi")
      .leftJoinAndSelect("pi.product",  "prod")
      .leftJoinAndSelect("prod.artist", "ap")
      .leftJoinAndSelect("ap.user",     "u")
      .where("pu.id = :id", { id })
      .getOne();

    if(!purchase)
      throw new NotFoundException("Purchase not found");

    if(!roles.includes(Role.ADMIN) && purchase.userId !== userId)
      throw new ForbiddenException("Access denied");

    return PurchaseDto.fromEntity(purchase);
  }
}
