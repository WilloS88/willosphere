import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PurchasesService } from "./purchases.service";
import { PurchaseDto } from "./dto/purchase.dto";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { ListPurchasesQueryDto } from "./dto/list-purchases-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";

@Controller("purchases")
@UseGuards(AuthGuard)
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreatePurchaseDto,
  ): Promise<PurchaseDto> {
    return this.purchases.create(req.userId, dto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query() query: ListPurchasesQueryDto,
  ): Promise<PaginatedResult<PurchaseDto>> {
    return this.purchases.findAll(req.userId, req.userRoles, query);
  }

  @Get(":id")
  findOne(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<PurchaseDto> {
    return this.purchases.findOne(id, req.userId, req.userRoles);
  }
}
