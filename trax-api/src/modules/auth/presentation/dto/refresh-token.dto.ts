import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtido no login' })
  @IsString()
  @MinLength(10)
  refreshToken: string;
}
