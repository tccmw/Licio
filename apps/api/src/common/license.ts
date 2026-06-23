import { LicenseType } from '@prisma/client';

export { LicenseType };

export const isLicenseType = (value: string): value is LicenseType =>
  value === LicenseType.FIRST_NORMAL || value === LicenseType.SECOND_NORMAL;
