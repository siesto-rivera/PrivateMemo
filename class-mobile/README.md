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

## TestFlight 빌드 / 배포

EAS Build + TestFlight 사용. App Store 출시 전 베타 배포 용도.

### 사전 준비
1. **Apple Developer Program** 가입 ($99/yr) — https://developer.apple.com/programs/
2. **App Store Connect** 에서 앱 등록 (출시는 안 해도 됨)
   - Bundle ID: `com.ngoworks.privatememo` (이미 `app.json`에 설정됨)
3. **Expo 계정** — https://expo.dev/ (무료)
4. **EAS CLI**: `npm install -g eas-cli && eas login`

### 첫 빌드
```bash
cd class-mobile

# 1. 프로젝트와 EAS 연결 (한 번만)
eas init  # 프롬프트 따라가기 (Expo 프로젝트 ID 자동 등록)

# 2. iOS 빌드 — Apple ID/팀 자동 처리
eas build --platform ios --profile production

# 빌드 시간: 15~30분. 완료되면 콘솔에 .ipa 다운로드 링크.

# 3. TestFlight 자동 제출
eas submit --platform ios --latest
```

### 테스터 초대
- App Store Connect → 본 앱 → **TestFlight** 탭
- **내부 테스터** (Apple Dev 계정 멤버): 즉시 설치 가능
- **외부 테스터** (이메일 초대): 첫 빌드만 Apple 베타 리뷰 (~24h), 이후 빌드 즉시 배포
- 테스터는 iPhone에서 **TestFlight 앱** 설치 → 초대 링크 → 앱 설치

### 코드 수정 후 새 빌드
```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

`autoIncrement: true` 설정으로 빌드 번호는 자동 증가. 외부 테스터에게도 즉시 배포됨.

### Build profile (`eas.json`)
- `development` — 개발 빌드 (devClient 포함, 시뮬레이터 가능)
- `preview` — internal distribution용 (Ad Hoc IPA, 등록된 디바이스만)
- `production` — TestFlight / App Store 제출용 (현재 사용 중)

## 더 알아보기

- [Expo 공식 문서](https://docs.expo.dev/)
- [Expo Router 가이드](https://docs.expo.dev/router/introduction)
- [NativeWind 문서](https://www.nativewind.dev/)

## 커뮤니티

- [Expo GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)
