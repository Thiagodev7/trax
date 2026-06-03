import { IsEmail, IsEnum, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class InviteUserDto {
  @ApiProperty({ example: 'joao@agencia.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.AGENCY_VIEWER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'IDs das empresas visíveis (obrigatório para COMPANY_VIEWER)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds?: string[];
}
