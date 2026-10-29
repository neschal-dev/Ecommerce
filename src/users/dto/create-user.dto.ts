import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  fullname: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('NP')
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}