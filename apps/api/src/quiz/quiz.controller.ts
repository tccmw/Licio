import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionQueryDto, SubmitQuizDto } from './dto/quiz.dto';
import { QuizService } from './quiz.service';

@Controller()
export class QuizController {
  constructor(private readonly quizzes: QuizService) {}

  @Get('questions')
  questions(@Query() query: QuestionQueryDto) {
    return this.quizzes.questions(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('quiz-attempts')
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitQuizDto) {
    return this.quizzes.submit(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('questions/wrong')
  wrongAnswers(@CurrentUser() user: AuthUser) {
    return this.quizzes.wrongAnswers(user.sub);
  }
}
