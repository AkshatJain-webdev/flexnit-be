import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto, UserRegistrationDto } from './dto/auth.dto';
import { Response } from 'express';
import { Public } from 'src/decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: UserRegistrationDto, @Res() res: Response): Promise<{ message: string }> {
    return await this.authService.register(userData, res);
  }

  @Post('login')
  async login(@Body() credentials: UserLoginDto, @Res() res: Response): Promise<any> {
    return await this.authService.login(credentials, res);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    return this.authService.logout(res);
  }
}
