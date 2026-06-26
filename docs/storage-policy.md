# Licio 모바일 데이터 저장소 분류

Licio 모바일 앱은 데이터의 수명과 민감도에 따라 저장소를 분리한다.

| 저장소 | 기준 | 현재 적용 데이터 |
| --- | --- | --- |
| Zustand store | 앱이 켜진 동안만 유지되어도 되는 데이터 | 현재 위치 좌표, 지도 중심, 진행 중 퀴즈 문항/답안/시작 시각, 화면에서 쓰는 세션 복사본 |
| AsyncStorage | 보안에 민감하지 않고 앱이 꺼져도 유지되어야 하는 데이터 | 위치 권한 요청 여부, 사용자가 직접 고른 수동 지역, 마지막으로 선택한 면허 종류/시험 방식 |
| EncryptedStorage | 보안이 필요하고 앱이 꺼져도 유지되어야 하는 데이터 | access token, refresh token, 로그인 사용자 세션 |

## 적용 원칙

- 사용자의 정확한 현재 위치 좌표는 로컬 영구 저장소에 저장하지 않는다.
- 진행 중인 모의시험 상태는 앱 종료 시 복구하지 않는다. 시험 결과는 서버 동기화 대상이다.
- 관심 학원, 관심 시험장, 시험 이력, 오답 노트는 로그인 계정 기준 서버 데이터로 보고 React Query 캐시만 사용한다.
- Expo Go처럼 `react-native-encrypted-storage` native module이 없는 환경에서는 `expo-secure-store` fallback을 사용한다.
- 기존 `expo-secure-store` 세션은 앱 실행 시 EncryptedStorage로 마이그레이션한 뒤 삭제한다.
