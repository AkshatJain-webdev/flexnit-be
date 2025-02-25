import { IsNumber, IsString, Matches, Max, Min } from 'class-validator';

export class UserLoginDto {
  @IsString()
  email: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must be at least 8 characters long and include at least one letter, one number, and one special character (e.g., @$!%*?&).',
  })
  password: string;
}

export class UserRegistrationDto extends UserLoginDto {
  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must be at least 8 characters long and include at least one letter, one number, and one special character (e.g., @$!%*?&).',
  })
  confirmPassword: string;

  @IsNumber()
  @Min(12, { message: 'You must be at least 12 years old to register' })
  @Max(120, { message: 'Invalid age' })
  age: number;
}
