import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  ArrayNotEmpty,
  ValidateNested,
  validate,
  IsDate,
} from 'class-validator';
import { Exclude, Expose, plainToInstance, Type } from 'class-transformer';
import { MongoClient, ObjectId } from 'mongodb';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

@Exclude()
export class IdNameModel {
  @Expose()
  @Type(() => ObjectId)
  _id: ObjectId;

  @Expose()
  @IsString()
  name: string;
}

export enum ShowType {
  MOVIE = 1,
  TV_SHOW = 2,
}

@Exclude()
export class ShowModel {
  @Expose()
  @Type(() => ObjectId)
  _id: ObjectId;

  @Expose()
  @IsString()
  show_id: string;

  @Expose()
  @IsEnum(ShowType)
  type: ShowType;

  @Expose()
  @IsString()
  title: string;

  @Expose()
  @IsString()
  @IsOptional()
  director?: string;

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cast?: string[];

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  countries?: string[];

  @Expose()
  @IsDate()
  @IsOptional()
  date_added?: Date;

  @Expose()
  @IsString()
  release_year: string;

  @Expose()
  @IsString()
  rating: string;

  @Expose()
  @IsString()
  duration: string;

  @Expose()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IdNameModel)
  categories: IdNameModel[];

  @Expose()
  @IsString()
  description: string;

  static async build(obj: any): Promise<ShowModel> {
    const instance = plainToInstance(
      ShowModel,
      { ...obj, _id: obj._id ?? new ObjectId() },
      { excludeExtraneousValues: true },
    );
    const errors = await validate(instance);
    if (errors.length > 0) {
      throw new InternalServerErrorException(
        `Schema validation failed for ${errors[0].property}: ${JSON.stringify(errors[0].constraints)}`,
      );
    }
    return instance;
  }

  async save(mongoClient: MongoClient): Promise<void> {
    try {
      const { _id, ...schema } = await ShowModel.build(this);
      await mongoClient
        .db()
        .collection('shows')
        .updateOne({ _id }, { $set: schema }, { upsert: true, ignoreUndefined: true });
    } catch (err) {
      console.error('Error saving show: ', err);
      throw new InternalServerErrorException(err);
    }
  }

  static async getById(mongoClient: MongoClient, id: string): Promise<ShowModel | undefined> {
    if (!id || !ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    try {
      const document = await mongoClient
        .db()
        .collection('shows')
        .findOne({ _id: new ObjectId(id) });
      return document ? ShowModel.build(document) : undefined;
    } catch (err) {
      console.error('Error fetching show by id: ', err);
      throw new InternalServerErrorException(err);
    }
  }
}
