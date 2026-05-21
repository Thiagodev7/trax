import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Converte string vazia em undefined para campos opcionais */
function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'contato@acme.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsUrl({ require_protocol: true }, { message: 'website must be a valid URL (include https://)' })
  @MaxLength(512)
  website?: string;

  @ApiPropertyOptional({ example: 'https://cdn.acme.com/logo.png' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsUrl({ require_protocol: true }, { message: 'logoUrl must be a valid URL (include https://)' })
  @MaxLength(1024)
  logoUrl?: string;
}
