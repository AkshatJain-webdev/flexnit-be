import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import { IsString, IsEmail, IsNumber, Min, Max, validate } from 'class-validator';
import { MongoClient, ObjectId } from 'mongodb';

export class UserModel {
  @Type(() => ObjectId)
  _id: ObjectId = new ObjectId();

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsNumber()
  @Min(13)
  @Max(120)
  age: number;

  static async build(obj: any): Promise<UserModel> {
    const instance = plainToInstance(UserModel, obj);
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
      const schema = await UserModel.build(this);
      if (!schema._id) {
        const existingAccount = await UserModel.getByEmail(mongoClient, this.email);
        if (existingAccount) {
          throw new BadRequestException('User with this email already exists');
        }
      }
      await mongoClient.db().collection('users').updateOne({ _id: this._id }, { $set: schema }, { upsert: true });
    } catch (err) {
      console.log('Error saving user: ', err);
      throw new InternalServerErrorException(err);
    }
  }

  static async getById(mongoClient: MongoClient, id: string): Promise<UserModel | undefined> {
    if (!id || !ObjectId.isValid(id)) {
      throw new InternalServerErrorException('Invalid id');
    }
    try {
      const document = await mongoClient
        .db()
        .collection('users')
        .findOne({ _id: new ObjectId(id) });
      if (document) {
        return UserModel.build(document);
      }
    } catch (err) {
      console.log('Error fetching user by id', err);
      throw new InternalServerErrorException(err);
    }
  }

  static async getByEmail(mongoClient: MongoClient, email: string): Promise<UserModel | undefined> {
    if (!email) {
      throw new InternalServerErrorException('Invalid email');
    }
    try {
      const document = await mongoClient.db().collection('users').findOne({ email });
      if (document) {
        return UserModel.build(document);
      }
    } catch (err) {
      console.log('Error fetching user by email: ', err);
      throw new InternalServerErrorException(err);
    }
  }
}
