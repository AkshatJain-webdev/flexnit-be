import { Injectable, InternalServerErrorException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { MongoClient } from 'mongodb';
import { mongoConfig } from 'src/configs/mongo.config';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  mongoClient: MongoClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const mongoConf: ConfigType<typeof mongoConfig> = this.configService.get('mongoConfig');
      let mongoUri = mongoConf.mongoBaseUri;
      if (mongoConf.mongoUser && mongoConf.mongoPassword) {
        mongoUri = mongoUri.replace(
          'mongodb+srv://',
          `mongodb+srv://${mongoConf.mongoUser}:${mongoConf.mongoPassword}@`,
        );
      }

      // Append database name
      mongoUri = `${mongoUri}/${mongoConf.mongoDatabase}`;
      this.mongoClient = await MongoClient.connect(mongoUri, {
        auth: {
          username: mongoConf.mongoUser,
          password: mongoConf.mongoPassword,
        },
      });
      await this.mongoClient.connect();
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw new InternalServerErrorException(error);
    }
  }

  async onModuleDestroy() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }
}
