# 지극히 사적인 메모장 — 모바일 (Expo) 👋

[Expo](https://expo.dev) 기반의 React Native 앱입니다. [`create-expo-app`](https://www.npmjs.com/package/create-expo-app)으로 생성했으며, [Expo Router](https://docs.expo.dev/router/introduction)의 파일 기반 라우팅과 [NativeWind](https://www.nativewind.dev) (Tailwind CSS) 스타일링을 사용합니다.

## 시작하기

1. 의존성 설치

   ```bash
   npm install
   ```

2. 앱 실행

   ```bash
   npx expo start
   ```

실행 후 콘솔에 다음 옵션들이 표시됩니다.

- [개발 빌드](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android 에뮬레이터](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS 시뮬레이터](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go) — 가벼운 샌드박스로 실기기에서 바로 확인

`i`(iOS) / `a`(Android) / `w`(웹) 키를 눌러 원하는 환경에서 실행하거나, QR 코드를 Expo Go 앱으로 스캔하세요.

## 폴더 구조

```
app/
├── _layout.tsx              # 루트 레이아웃 (전역 CSS 로드)
└── (tabs)/
    ├── _layout.tsx          # 5개 탭 정의 (홈/카테고리/추가/알림/설정)
    ├── index.tsx            # 홈 — 검색바 + 최근 메모
    ├── categories.tsx       # 카테고리 그리드 + 사용자 추가
    ├── add.tsx              # 메모 추가 폼
    ├── alarms.tsx           # 알림 예약된 메모 모음
    └── settings.tsx         # 환경 설정
components/
├── screen-header.tsx        # 공통 상단 헤더
└── memo-card.tsx            # 메모 카드 컴포넌트
lib/
└── mock-data.ts             # 타입 정의 + 더미 데이터
```

`app/` 디렉터리의 파일들을 수정하며 개발하면 됩니다. 라우팅은 폴더·파일명에 따라 자동으로 생성됩니다.

## NativeWind (Tailwind) 설정 파일

- `tailwind.config.js` — 콘텐츠 경로 + 브랜드 컬러 (`brand.500`, `brand.600` 등)
- `global.css` — Tailwind 진입 파일
- `babel.config.js` — `nativewind/babel` 프리셋 적용
- `metro.config.js` — `withNativeWind`로 CSS 처리
- `nativewind-env.d.ts` — TypeScript용 타입 선언

## 데이터 영속화 / 알림 (다음 단계)

현재는 `lib/mock-data.ts`의 더미 데이터로만 동작합니다. 실제 구현 시 다음을 추가할 예정입니다.

- `expo-sqlite` 또는 `AsyncStorage`로 메모 영구 저장
- `expo-notifications`로 `alarm_date`에 푸시 알림 등록

## 더 알아보기

- [Expo 공식 문서](https://docs.expo.dev/)
- [Expo Router 가이드](https://docs.expo.dev/router/introduction)
- [NativeWind 문서](https://www.nativewind.dev/)

## 커뮤니티

- [Expo GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)
