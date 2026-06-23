import { FavoriteType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateFavoriteDto {
  @IsEnum(FavoriteType)
  type!: FavoriteType;

  @IsString()
  targetId!: string;

  @IsString()
  label!: string;
}
