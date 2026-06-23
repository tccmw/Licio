import { Controller, Get, Query } from '@nestjs/common';
import { ExamQueryDto } from './dto/exam-query.dto';
import { ExamService } from './exam.service';

@Controller('exams')
export class ExamController {
  constructor(private readonly exams: ExamService) {}

  @Get()
  find(@Query() query: ExamQueryDto) {
    return this.exams.find(query);
  }
}
