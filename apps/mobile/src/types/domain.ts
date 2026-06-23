export type LicenseType = 'FIRST_NORMAL' | 'SECOND_NORMAL';
export type QuizMode = 'QUICK' | 'MOCK';

export type Academy = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  rating?: number;
  distanceMeters: number;
};

export type ExamSchedule = {
  id?: string;
  providerId: string;
  centerId: string;
  centerName: string;
  licenseType: LicenseType;
  category: string;
  startsAt: string | Date;
  endsAt?: string | Date;
  bookingUrl: string;
};

export type QuizQuestion = { id: string; prompt: string; choices: string[] };
export type QuizReview = { questionId: string; selectedIndex: number; correctIndex: number; isCorrect: boolean; explanation: string };
export type QuizResult = { attemptId: string; score: number; total: number; answers: QuizReview[] };

export type SessionUser = { id: string; name: string; email?: string | null; avatarUrl?: string | null };
export type Session = { accessToken: string; refreshToken: string; user: SessionUser };

export type Favorite = { id: string; type: 'ACADEMY' | 'EXAM_CENTER'; targetId: string; label: string; createdAt: string };
export type UserOverview = SessionUser & {
  _count: { quizAttempts: number; wrongAnswers: number; favorites: number };
  quizAttempts: Array<{ id: string; score: number; total: number; mode: string; completedAt: string; licenseType: LicenseType }>;
};
