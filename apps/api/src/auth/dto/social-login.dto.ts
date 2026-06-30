import { SocialProvider } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  idToken?: string;

}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}
