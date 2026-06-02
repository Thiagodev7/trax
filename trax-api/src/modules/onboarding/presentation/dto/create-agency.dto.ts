import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional, IsIn } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  agencyName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hifens',
  })
  slug: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  adminPassword: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+55)?\d{10,11}$/, {
    message: 'Informe um telefone brasileiro válido (DDD + número)',
  })
  adminPhone: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve ser um hex válido (#RRGGBB)' })
  primaryColor?: string;

  @IsOptional()
  @IsIn(['light', 'dark'], { message: 'Tema deve ser light ou dark' })
  themeMode?: 'light' | 'dark';
}
