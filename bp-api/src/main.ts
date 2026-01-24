import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app             = await NestFactory.create(AppModule);
  const configService   = app.get(ConfigService);
  const port            = configService.get<number>("PORT") ?? 3000;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
      origin: configService.get<string>("FRONTEND_ORIGIN"),
      credentials: true,
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(port);
}
bootstrap();
