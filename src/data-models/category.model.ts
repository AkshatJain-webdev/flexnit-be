import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { MongoClient, ObjectId } from 'mongodb';

export class CategoryModel {
  @Type(() => ObjectId)
  _id: ObjectId = new ObjectId();

  @IsString()
  name: string;

  static async build(obj: any): Promise<CategoryModel> {
    const instance = plainToInstance(CategoryModel, obj);
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
      const schema = await CategoryModel.build(this);
      if (!schema._id) {
        const existingCategory = await CategoryModel.getByName(mongoClient, this.name);
        if (existingCategory) {
          throw new BadRequestException('Category with this name already exists');
        }
      }
      await mongoClient.db().collection('categories').updateOne({ _id: this._id }, { $set: schema }, { upsert: true });
    } catch (err) {
      console.log('Error saving category: ', err);
      throw new InternalServerErrorException(err);
    }
  }

  static async getById(mongoClient: MongoClient, id: string): Promise<CategoryModel | undefined> {
    if (!id || !ObjectId.isValid(id)) {
      throw new InternalServerErrorException('Invalid id');
    }
    try {
      const document = await mongoClient
        .db()
        .collection('categories')
        .findOne({ _id: new ObjectId(id) });
      if (document) {
        return CategoryModel.build(document);
      }
    } catch (err) {
      console.log('Error fetching category by id', err);
      throw new InternalServerErrorException(err);
    }
  }

  static async getByName(mongoClient: MongoClient, name: string): Promise<CategoryModel | undefined> {
    if (!name) {
      throw new InternalServerErrorException('Invalid category name');
    }
    try {
      const document = await mongoClient.db().collection('categories').findOne({ name });
      if (document) {
        return CategoryModel.build(document);
      }
    } catch (err) {
      console.log('Error fetching category by name: ', err);
      throw new InternalServerErrorException(err);
    }
  }
}
