import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class CreateClientDto {
  @IsString() @MinLength(2) fullName: string;
  @IsString() @MinLength(5) document: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}
