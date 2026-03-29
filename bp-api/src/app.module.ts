import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ArtistsModule } from "./artists/artists.module";
import { GenresModule } from "./genres/genres.module";
import { TracksModule } from "./tracks/tracks.module";
import { AlbumsModule } from "./albums/albums.module";
import { PlaylistsModule } from "./playlists/playlists.module";
import { ProductsModule } from "./products/products.module";
import { PurchasesModule } from "./purchases/purchases.module";
import { JwtModule } from "node_modules/@nestjs/jwt";

@Module({
  imports: [
    ConfigModule.forRoot({
        isGlobal: true
    }),
     JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg) => ({
        secret: cfg.get("JWT_SECRET"),
         signOptions: {
          expiresIn: cfg.get("JWT_EXPIRES_IN") ?? "30m",
        },
      }),
      global: true,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: "mysql",
        host: cfg.get<string>("MYSQL_HOST"),
        port: cfg.get<number>("MYSQL_PORT"),
        username: cfg.get<string>("MYSQL_USER"),
        password: cfg.get<string>("MYSQL_PASSWORD"),
        database: cfg.get<string>("MYSQL_DATABASE"),
        autoLoadEntities: true,
        synchronize: false,
        logging: cfg.get("DB_LOGGING") === "true",
        timezone: "Z",
      }),
    }),
    UsersModule,
    AuthModule,
    ArtistsModule,
    GenresModule,
    TracksModule,
    AlbumsModule,
    PlaylistsModule,
    ProductsModule,
    PurchasesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
