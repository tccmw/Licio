import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LicenseType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExamQueryDto, ProviderSchedule } from './dto/exam-query.dto';
import { OfficialScheduleProvider } from './official-schedule.provider';

const BOOKING_URL = 'https://safedriving.or.kr/';

function nextWeekday(dayOffset: number, hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function demoSchedules(): ProviderSchedule[] {
  return [
    { providerId: 'demo-seoul-1', centerId: 'seoul-west', centerName: '서울서부운전면허시험장', licenseType: LicenseType.FIRST_NORMAL, category: '학과시험', startsAt: nextWeekday(2, 10), bookingUrl: BOOKING_URL },
    { providerId: 'demo-seoul-2', centerId: 'seoul-west', centerName: '서울서부운전면허시험장', licenseType: LicenseType.SECOND_NORMAL, category: '기능시험', startsAt: nextWeekday(4, 14), bookingUrl: BOOKING_URL },
    { providerId: 'demo-dobong-1', centerId: 'dobong', centerName: '도봉운전면허시험장', licenseType: LicenseType.FIRST_NORMAL, category: '도로주행시험', startsAt: nextWeekday(6, 11), bookingUrl: BOOKING_URL },
  ];
}

@Injectable()
export class ExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: OfficialScheduleProvider,
  ) {}

  async find(query: ExamQueryDto) {
    const schedules = await this.prisma.examSchedule.findMany({
      where: {
        startsAt: { gte: new Date(query.from), lte: new Date(`${query.to}T23:59:59.999Z`) },
        ...(query.licenseType ? { licenseType: query.licenseType } : {}),
        ...(query.centerId ? { centerId: query.centerId } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
    if (schedules.length) {
      return { schedules, source: 'official', updatedAt: schedules.reduce((latest, item) => item.updatedAt > latest ? item.updatedAt : latest, schedules[0].updatedAt) };
    }
    const from = new Date(query.from);
    const to = new Date(`${query.to}T23:59:59.999Z`);
    return {
      schedules: demoSchedules().filter((item) => item.startsAt >= from && item.startsAt <= to && (!query.licenseType || item.licenseType === query.licenseType) && (!query.centerId || item.centerId === query.centerId)),
      source: 'demo',
      updatedAt: new Date(),
    };
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async sync() {
    const schedules = await this.provider.fetchSchedules();
    if (!schedules.length) return { imported: 0 };
    await this.prisma.$transaction(schedules.map((schedule) => this.prisma.examSchedule.upsert({
      where: { providerId: schedule.providerId },
      update: { ...schedule, source: 'official' },
      create: { ...schedule, source: 'official' },
    })));
    return { imported: schedules.length };
  }
}
