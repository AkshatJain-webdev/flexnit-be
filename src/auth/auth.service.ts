import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { UserModel } from 'src/data-models/user.model';
import { MongoService } from 'src/utils/mongo.service';
import { UserLoginDto, UserRegistrationDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService, ConfigType } from '@nestjs/config';
import { authConfig } from '../configs/auth.config';

@Injectable()
export class AuthService {
  private mongoClient: MongoClient;
  private readonly authConf: ConfigType<typeof authConfig>;

  constructor(
    private readonly mongoService: MongoService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.mongoClient = this.mongoService.mongoClient;
    this.authConf = this.configService.get('authConfig');
  }

  async register(userData: UserRegistrationDto, res: Response): Promise<any> {
    try {
      const existingUser = await UserModel.getByEmail(this.mongoClient, userData.email);
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await UserModel.build({
        email: userData.email,
        password: hashedPassword,
        age: userData.age,
      });

      await user.save(this.mongoClient);
      await this.generateToken(user, res);

      return res.status(201).send({ message: 'Registered successfully.' });
    } catch (err) {
      console.log('asr1', err);
      throw err instanceof BadRequestException ? err : new InternalServerErrorException('Something went wrong.');
    }
  }

  async login(credentials: UserLoginDto, res: Response): Promise<any> {
    try {
      const user = await UserModel.getByEmail(this.mongoClient, credentials.email);
      if (!user) {
        throw new BadRequestException('Provided email does not belong to a registered user');
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.generateToken(user, res);

      return res.status(201).send({ message: 'Login successful.' });
    } catch (err) {
      console.log('asl1', err);
      throw err instanceof BadRequestException || err instanceof UnauthorizedException
        ? err
        : new InternalServerErrorException('Something went wrong.');
    }
  }

  async generateToken(user: UserModel, res: Response): Promise<{ access_token: string }> {
    const payload = { userId: user._id.toString(), email: user.email, age: user.age };
    const access_token = await this.jwtService.signAsync(payload);
    res.cookie('flexnit_access_token', access_token, {
      httpOnly: true,
      secure: this.authConf.secureCookie,
      sameSite: this.authConf.secureCookie ? 'none' : 'strict',
      maxAge: this.authConf.tokenExpiration * 1000,
    });
    return { access_token };
  }

  logout(res: Response) {
    res.clearCookie('flexnit_access_token', { httpOnly: true, secure: true, sameSite: 'strict' });
    return res.json({ message: 'Logged out successfully' });
  }
}
