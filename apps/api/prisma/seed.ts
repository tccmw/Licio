import { LicenseType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const topics = ['표지판 인지', '보행자 보호', '안전거리', '교차로 통행', '차로 변경', '악천후 운전', '긴급상황 대응', '주정차', '우선순위', '방어운전'];

function demoQuestions(licenseType: LicenseType) {
  const label = licenseType === LicenseType.FIRST_NORMAL ? '1종 보통' : '2종 보통';
  return Array.from({ length: 40 }, (_, index) => {
    const topic = topics[index % topics.length];
    return {
      licenseType,
      prompt: `[데모 ${label} ${index + 1}] ${topic} 학습 화면을 확인하기 위한 예시 문항입니다. 정답은 무엇인가요?`,
      choices: ['공식 교통안전 자료와 현재 규정을 확인한다.', '주변 차량의 행동만 보고 판단한다.', '기억에만 의존해 판단한다.', '확인 없이 즉시 행동한다.'],
      answerIndex: 0,
      explanation: '프로토타입용 예시 해설입니다. 실제 면허시험 준비에는 도로교통공단의 최신 공식 자료를 사용하세요.',
      isDemo: true,
    };
  });
}

async function main() {
  await prisma.question.deleteMany({ where: { isDemo: true } });
  await prisma.question.createMany({ data: [...demoQuestions(LicenseType.FIRST_NORMAL), ...demoQuestions(LicenseType.SECOND_NORMAL)] });
  console.log('Seeded 80 demo questions.');
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
