import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MongoService } from './utils/mongo.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { authConfig } from './configs/auth.config';
import { AuthGuard } from './guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { mongoConfig } from './configs/mongo.config';
import { ShowsController } from './shows/shows.controller';
import { ShowsService } from './shows/shows.service';
import { CsvService } from './utils/csv.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [authConfig, mongoConfig],
      isGlobal: true,
      envFilePath: '.env.develop',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('authConfig.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<number>('authConfig.tokenExpiration'),
        },
      }),
    }),
  ],
  controllers: [AppController, AuthController, ShowsController],
  providers: [
    AppService,
    AuthService,
    {
      provide: MongoService,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<MongoService> => {
        const mongoService = new MongoService(configService);
        await mongoService.onModuleInit();
        return mongoService;
      },
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    ShowsService,
    CsvService,
  ],
})
export class AppModule {}
