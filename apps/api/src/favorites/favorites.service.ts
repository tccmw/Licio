import { Injectable } from '@nestjs/common';
import { FavoriteType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  add(userId: string, dto: CreateFavoriteDto) {
    return this.prisma.favorite.upsert({
      where: { userId_type_targetId: { userId, type: dto.type, targetId: dto.targetId } },
      update: { label: dto.label },
      create: { userId, ...dto },
    });
  }

  remove(userId: string, type: FavoriteType, targetId: string) {
    return this.prisma.favorite.deleteMany({ where: { userId, type, targetId } });
  }
}
