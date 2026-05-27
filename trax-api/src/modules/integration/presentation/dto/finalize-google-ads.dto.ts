import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FinalizeGoogleAdsDto {
  @IsString()
  @IsNotEmpty()
  pendingId!: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsOptional()
  displayName?: string;
}
