import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";
import * as cookieParser from "cookie-parser";

import { AppModule } from "../../src/app.module";
import { CloudFrontService } from "../../src/common/cloudfront.service";

/**
 * Stub pro CloudFrontService — v testech nechceme volat AWS ani řešit
 * podpis URL. Vrací jen vstup beze změny.
 */
class CloudFrontServiceStub {
  signUrl(input: string): string {
    return input;
  }
}

/**
 * Postaví Nest aplikaci nad testovací databází `willosphere_test`.
 * Aplikuje stejné globální piny jako produkční main.ts:
 *   - cookie-parser
 *   - ValidationPipe (whitelist + forbidNonWhitelisted + transform)
 */
export async function bootstrapTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(CloudFrontService)
    .useClass(CloudFrontServiceStub)
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const dataSource = app.get(DataSource);
  return { app, dataSource };
}

/**
 * Vyprázdní všechny aplikační tabulky.
 * Truncate je výrazně rychlejší než drop & sync mezi testy.
 */
export async function truncateAllTables(ds: DataSource): Promise<void> {
  const tables = ds.entityMetadatas.map((m) => m.tableName);

  await ds.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const t of tables) {
    // Ignoruj tabulky, které ještě neexistují (např. po prvním běhu).
    await ds.query(`TRUNCATE TABLE \`${t}\``).catch(() => undefined);
  }
  await ds.query("SET FOREIGN_KEY_CHECKS = 1");
}
