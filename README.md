# Licio

운전면허 준비를 위한 Android 우선 MVP입니다. 가까운 운전학원 탐색, 퀵 테스트와 실전 모의시험, 시험 일정 캘린더를 제공합니다.

- `apps/mobile`: Expo + TypeScript 기반 React Native 앱
- `apps/api`: NestJS/Fastify + Prisma + PostgreSQL API

외부 API 키가 없어도 **데모 모드**로 학원·시험 일정·문제를 확인할 수 있습니다. 실제 Google Places와 공식 시험 일정 데이터는 키와 공급자 연결 후 자동으로 대체됩니다.

## 준비물

- Node.js `20.19` 이상
- npm `10` 이상
- Android 실기기 테스트용 [Expo Go](https://expo.dev/go) 앱
- API와 기록 저장까지 테스트하려면 Docker Desktop

## 가장 빠른 화면 테스트

이 방법은 Docker, 데이터베이스, 외부 API 키 없이 가능합니다. 학원·일정·문제는 데모 데이터로 보입니다.

```powershell
npm install
npm run start:expo-go
```

명령이 표시하는 QR 코드를 Android의 Expo Go 앱으로 스캔합니다. PC와 휴대폰은 같은 Wi-Fi에 연결되어 있어야 합니다.

확인할 수 있는 흐름은 다음과 같습니다.

1. 위치 권한을 허용하거나 서울·경기 등 지역을 선택합니다.
2. 홈에서 주변 학원, 모의시험, 시험 일정을 엽니다.
3. 퀵 테스트 10문제와 실전 모드 40문제를 완료합니다.
4. 달력에서 일정과 공식 접수 링크를 확인합니다.

데모 모드에서는 로그인, 성적 서버 저장, 관심 항목 동기화는 동작하지 않습니다.

## API와 데이터베이스까지 테스트

### 1. 환경 변수 생성

```powershell
Copy-Item .env.example apps\api\.env
Copy-Item .env.example apps\mobile\.env
```

`apps/api/.env`에서 최소한 아래 값을 변경합니다.

```dotenv
DATABASE_URL="postgresql://licio:licio@localhost:5432/licio?schema=public"
JWT_ACCESS_SECRET="충분히-긴-임의의-access-secret"
JWT_REFRESH_SECRET="access-secret과-다른-충분히-긴-refresh-secret"
```

Android 에뮬레이터는 `apps/mobile/.env`의 기본 API 주소인 `http://10.0.2.2:3000/v1`를 그대로 사용합니다. 실제 휴대폰에서는 PC의 LAN IP를 사용해야 합니다.

```dotenv
EXPO_PUBLIC_API_BASE_URL="http://192.168.0.10:3000/v1"
```

### 2. PostgreSQL과 API 시작

```powershell
docker compose up -d db
npm run db:setup
npm run dev:api
```

별도 PowerShell에서 API 상태를 확인합니다.

```powershell
Invoke-RestMethod http://localhost:3000/v1/health
```

`status: ok` 응답을 받으면 정상입니다. 이후 모바일 앱을 다시 시작합니다.

```powershell
npm run start:expo-go
```

`.env`를 변경한 뒤에는 Expo 개발 서버를 종료하고 다시 시작해야 합니다.

## Android 지도·로그인 실기기 테스트

Google Maps 키 또는 카카오/Google 로그인을 적용하려면 Expo Go 대신 개발 빌드가 필요합니다.

```powershell
npm run android --workspace=@licio/mobile
```

Android Studio와 에뮬레이터 또는 USB 디버깅이 설정된 Android 기기가 필요합니다. 지도 키는 `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`에 설정합니다.

## 직접 준비해야 하는 항목

### 출시 전에 필수

- Google Cloud 프로젝트: Maps SDK for Android, Places API 활성화 및 Android 앱 제한 API 키 발급
- Kakao Developers와 Google Cloud OAuth: Android 패키지명 `com.licio.app`, 서명 SHA-1, 리디렉션 스킴 `licio://` 등록
- 운영 PostgreSQL, 강한 JWT 비밀값, HTTPS API 도메인 구성
- 재배포 권한이 있는 운전면허 문제·해설 데이터 또는 자체 검수 문제은행 확보
- 도로교통공단/공공데이터 시험 일정 공급자의 이용 권한과 호출 한도 확인

### 현재 코드에 공급자별로 연결할 값

| 기능 | 환경 변수 | 기본 동작 |
| --- | --- | --- |
| 주변 학원 | `GOOGLE_PLACES_API_KEY` | 데모 학원 목록 |
| Android 지도 | `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` | 개발 빌드에서 지도 키 적용 |
| Google 로그인 | `GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | 로그인 비활성화 |
| Kakao 로그인 | `KAKAO_REST_API_KEY`, `EXPO_PUBLIC_KAKAO_REST_API_KEY` | 로그인 비활성화 |
| 시험 일정 | `KOROAD_SCHEDULE_FEED_URL`, `KOROAD_SCHEDULE_API_KEY` | 데모 일정 |

`KOROAD_SCHEDULE_FEED_URL`은 현재 정규화된 일정 피드 계약을 받는 어댑터입니다. 실제 공공데이터 API의 원본 응답 형식이 다르면 `apps/api/src/exam/official-schedule.provider.ts`에서 해당 형식을 `ProviderSchedule`로 변환하면 됩니다.

## 주의 사항

- 시드된 80개 문항은 UI와 채점 흐름 검증용 데모 콘텐츠이며, 공식 기출문제가 아닙니다.
- 정확한 사용자 위치는 데이터베이스에 저장하지 않고, 주변 학원 검색 요청에만 사용합니다.
- 앱 내부에서 시험 접수를 처리하지 않습니다. 일정 상세의 링크는 공식 접수 페이지로만 이동합니다.
