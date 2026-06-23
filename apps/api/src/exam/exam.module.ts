import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { OfficialScheduleProvider } from './official-schedule.provider';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ExamController],
  providers: [ExamService, OfficialScheduleProvider],
})
export class ExamModule {}
