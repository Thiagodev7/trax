import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuperAdminLoginDto {
  @ApiProperty({ example: 'admin@traxsolucoes.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '••••••••' })
  @IsString()
  @MinLength(8)
  password: string;
}
