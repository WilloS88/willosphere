import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { SearchService } from "./search.service";
import { SearchQueryDto } from "./dto/search-query.dto";

@Controller("search")
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Req() req: Request, @Query() query: SearchQueryDto) {
    const userId = (req as any).userId as number;
    return this.searchService.search(userId, query);
  }
}
