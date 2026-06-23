import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { LicenseType } from '../../common/license';

export class ExamQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @IsOptional()
  @IsString()
  centerId?: string;
}

export type ProviderSchedule = {
  providerId: string;
  centerId: string;
  centerName: string;
  licenseType: LicenseType;
  category: string;
  startsAt: Date;
  endsAt?: Date;
  bookingUrl: string;
};
