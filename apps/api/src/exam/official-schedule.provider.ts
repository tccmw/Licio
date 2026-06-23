import { Injectable, Logger } from '@nestjs/common';
import { LicenseType } from '../common/license';
import { ProviderSchedule } from './dto/exam-query.dto';

/**
 * The provider isolates the API-specific payload from application code. Set
 * KOROAD_SCHEDULE_FEED_URL to a licensed, normalized public-data feed; an
 * adapter can be changed here without altering the client response contract.
 */
@Injectable()
export class OfficialScheduleProvider {
  private readonly logger = new Logger(OfficialScheduleProvider.name);

  async fetchSchedules(): Promise<ProviderSchedule[]> {
    const url = process.env.KOROAD_SCHEDULE_FEED_URL;
    if (!url) return [];

    try {
      const response = await fetch(url, {
        headers: process.env.KOROAD_SCHEDULE_API_KEY ? { Authorization: `Bearer ${process.env.KOROAD_SCHEDULE_API_KEY}` } : undefined,
      });
      if (!response.ok) throw new Error(`schedule feed returned ${response.status}`);
      const payload = await response.json() as { schedules?: Array<Record<string, unknown>> };
      return (payload.schedules ?? []).flatMap((item) => this.toSchedule(item));
    } catch (error) {
      this.logger.error(`Official schedule sync failed: ${String(error)}`);
      return [];
    }
  }

  private toSchedule(item: Record<string, unknown>): ProviderSchedule[] {
    const licenseType = item.licenseType;
    const startsAt = item.startsAt;
    if ((licenseType !== LicenseType.FIRST_NORMAL && licenseType !== LicenseType.SECOND_NORMAL) || typeof startsAt !== 'string') return [];
    const date = new Date(startsAt);
    if (Number.isNaN(date.getTime())) return [];
    return [{
      providerId: String(item.id),
      centerId: String(item.centerId),
      centerName: String(item.centerName),
      licenseType,
      category: typeof item.category === 'string' ? item.category : '필기시험',
      startsAt: date,
      endsAt: typeof item.endsAt === 'string' ? new Date(item.endsAt) : undefined,
      bookingUrl: typeof item.bookingUrl === 'string' ? item.bookingUrl : 'https://safedriving.or.kr/',
    }];
  }
}
