import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { AcademyModule } from './academy/academy.module';
import { AuthModule } from './auth/auth.module';
import { ExamModule } from './exam/exam.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { QuizModule } from './quiz/quiz.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '..', '.env'),
    }),
    PrismaModule,
    AuthModule,
    AcademyModule,
    ExamModule,
    QuizModule,
    FavoritesModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
