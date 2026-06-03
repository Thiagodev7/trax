import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiProperty()
  @IsBoolean()
  notifyReportPublished: boolean;

  @ApiProperty()
  @IsBoolean()
  notifyIntegrationErrors: boolean;

  @ApiProperty()
  @IsBoolean()
  notifyNewCompany: boolean;

  @ApiProperty()
  @IsBoolean()
  notifyWeeklySummary: boolean;
}
