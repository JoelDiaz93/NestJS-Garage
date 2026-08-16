import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(12) password: string;
  @IsString() @MinLength(2) fullName: string;
  @IsArray() @ArrayMinSize(1) @IsEnum(UserRole, { each: true }) roles: UserRole[];
}
