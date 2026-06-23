import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { quizAttempts: true, wrongAnswers: true, favorites: true } },
        quizAttempts: { orderBy: { completedAt: 'desc' }, take: 5, select: { id: true, score: true, total: true, mode: true, completedAt: true, licenseType: true } },
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }
}
