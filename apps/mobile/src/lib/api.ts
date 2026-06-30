import { Academy, ExamSchedule, Favorite, LicenseType, QuizMode, QuizQuestion, QuizResult, Session, UserOverview } from '../types/domain';

export type SocialSignInRequest = {
  provider: 'GOOGLE' | 'KAKAO' | 'APPLE';
  accessToken?: string;
  idToken?: string;
};

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

type NearbyResponse = { academies: Academy[]; source: 'google' | 'demo'; searchedAt: string; locationStored: false };
type ExamResponse = { schedules: ExamSchedule[]; source: 'official' | 'demo'; updatedAt: string };

async function request<T>(path: string, options: RequestInit = {}, session?: Session): Promise<T> {
  if (!baseUrl) throw new Error('API base URL이 설정되지 않았습니다.');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined) as { message?: string } | undefined;
    throw new Error(payload?.message ?? '요청을 처리하지 못했습니다.');
  }
  return response.json() as Promise<T>;
}

const demoAcademies = (latitude: number, longitude: number): Academy[] => [
  { id: 'demo-1', name: 'Licio 인근 운전전문학원', address: '현재 위치 기준 데모 주소', latitude: latitude + 0.008, longitude: longitude + 0.005, phone: '02-0000-1001', rating: 4.6, distanceMeters: 890 },
  { id: 'demo-2', name: 'Licio 안전운전학원', address: '현재 위치 기준 데모 주소', latitude: latitude - 0.006, longitude: longitude - 0.009, phone: '02-0000-1002', rating: 4.4, distanceMeters: 1200 },
  { id: 'demo-3', name: 'Licio 자동차운전학원', address: '현재 위치 기준 데모 주소', latitude: latitude + 0.012, longitude: longitude - 0.01, phone: '02-0000-1003', rating: 4.3, distanceMeters: 1900 },
];

const at = (days: number, hours: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
};

function demoExams(licenseType?: LicenseType): ExamSchedule[] {
  const schedules: ExamSchedule[] = [
    { providerId: 'demo-1', centerId: 'seoul-west', centerName: '서울서부운전면허시험장', licenseType: 'FIRST_NORMAL', category: '학과시험', startsAt: at(2, 10), bookingUrl: 'https://safedriving.or.kr/' },
    { providerId: 'demo-2', centerId: 'seoul-west', centerName: '서울서부운전면허시험장', licenseType: 'SECOND_NORMAL', category: '기능시험', startsAt: at(4, 14), bookingUrl: 'https://safedriving.or.kr/' },
    { providerId: 'demo-3', centerId: 'dobong', centerName: '도봉운전면허시험장', licenseType: 'FIRST_NORMAL', category: '도로주행시험', startsAt: at(6, 11), bookingUrl: 'https://safedriving.or.kr/' },
  ];
  return schedules.filter((exam) => !licenseType || exam.licenseType === licenseType);
}

const demoQuestions = (licenseType: LicenseType): QuizQuestion[] => Array.from({ length: 40 }, (_, index) => ({
  id: `demo-${licenseType}-${index + 1}`,
  prompt: `[데모 ${licenseType === 'FIRST_NORMAL' ? '1종 보통' : '2종 보통'} ${index + 1}] 학습 흐름을 확인하기 위한 예시 문항입니다.`,
  choices: ['공식 자료를 확인한다.', '기억만으로 판단한다.', '확인 없이 진행한다.', '다른 사람에게만 맡긴다.'],
}));

export const api = {
  async nearbyAcademies(latitude: number, longitude: number): Promise<NearbyResponse> {
    if (!baseUrl) return { academies: demoAcademies(latitude, longitude), source: 'demo', searchedAt: new Date().toISOString(), locationStored: false };
    return request<NearbyResponse>(`/academies/nearby?lat=${latitude}&lng=${longitude}`);
  },

  async exams(from: string, to: string, licenseType?: LicenseType): Promise<ExamResponse> {
    if (!baseUrl) return { schedules: demoExams(licenseType), source: 'demo', updatedAt: new Date().toISOString() };
    const params = new URLSearchParams({ from, to, ...(licenseType ? { licenseType } : {}) });
    return request<ExamResponse>(`/exams?${params}`);
  },

  async questions(licenseType: LicenseType, mode: QuizMode) {
    if (!baseUrl) return { isDemo: true, questions: demoQuestions(licenseType).slice(0, mode === 'QUICK' ? 10 : 40) };
    return request<{ isDemo: boolean; questions: QuizQuestion[] }>(`/questions?licenseType=${licenseType}&mode=${mode}`);
  },

  async submitQuiz(session: Session | undefined, licenseType: LicenseType, mode: QuizMode, durationSec: number, answers: { questionId: string; selectedIndex: number }[]): Promise<QuizResult> {
    if (!baseUrl || !session) {
      return {
        attemptId: 'local-demo',
        score: answers.filter((answer) => Number(answer.questionId.split('-').at(-1)) % 4 === answer.selectedIndex).length,
        total: answers.length,
        answers: answers.map((answer) => ({
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex,
          correctIndex: Number(answer.questionId.split('-').at(-1)) % 4,
          isCorrect: Number(answer.questionId.split('-').at(-1)) % 4 === answer.selectedIndex,
          explanation: '프로토타입 예시 해설입니다. 실제 시험 준비에는 공식 자료를 확인하세요.',
        })),
      };
    }
    return request<QuizResult>('/quiz-attempts', { method: 'POST', body: JSON.stringify({ licenseType, mode, durationSec, answers }) }, session);
  },

  signIn(payload: SocialSignInRequest) {
    return request<Session>('/auth/social', { method: 'POST', body: JSON.stringify(payload) });
  },

  me(session: Session) {
    return request<UserOverview>('/me', {}, session);
  },

  favorites(session: Session) {
    return request<Favorite[]>('/favorites', {}, session);
  },

  addFavorite(session: Session, type: Favorite['type'], targetId: string, label: string) {
    return request<Favorite>('/favorites', { method: 'POST', body: JSON.stringify({ type, targetId, label }) }, session);
  },

  removeFavorite(session: Session, type: Favorite['type'], targetId: string) {
    return request<{ count: number }>(`/favorites/${type}/${targetId}`, { method: 'DELETE' }, session);
  },
};
