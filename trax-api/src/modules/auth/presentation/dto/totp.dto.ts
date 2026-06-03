import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTotpDto {
  @ApiProperty({ description: 'Código TOTP de 6 dígitos', example: '123456' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class MfaLoginDto {
  @ApiProperty({ description: 'Token de desafio MFA retornado no login' })
  @IsString()
  mfaChallengeToken!: string;

  @ApiProperty({ description: 'Código TOTP de 6 dígitos', example: '123456' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
