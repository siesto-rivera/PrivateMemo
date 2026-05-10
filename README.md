# 지극히 사적인 메모장

일상 속 여러 영역에서 수집되는 정보들을 카테고리별로 분류해 저장하고, 필요할 때 빠르게 찾아보기 위한 개인용 메모 앱입니다. 모바일(Expo)과 웹(Next.js) 두 클라이언트를 함께 제공합니다.

## 배포 URL

| 채널 | URL | 설명 |
| --- | --- | --- |
| 🌐 웹 (커스텀 도메인) | https://memo.ngoworks.org | Next.js (Vercel) |
| 🌐 웹 (Vercel 기본) | https://private-memo.vercel.app | 동일 배포의 기본 URL |
| 🔧 백엔드 API | https://memoapi.ngoworks.org/api | Django REST API (AWS Lightsail) |
| 📄 개인정보 처리방침 | https://memoapi.ngoworks.org/privacy/ | |
| 📱 iOS (TestFlight) | 초대 링크 (베타 테스터 모집) | Expo / EAS |

## 주요 기능

- **카테고리별 메모 분류** — 영화, 책, 주소, 맛집, 비번, 차량관리 등 (사용자가 직접 추가 가능)
- **태그** — 한 메모에 여러 태그를 붙여 검색·필터에 활용
- **푸시 알람 예약** — 만기일·정비일 등 특정 날짜에 알림 받기 *(다음 단계 구현 예정)*
- **빠른 검색** — 메모 내용·카테고리·태그 통합 검색
- **모바일 + 웹** — 동일한 화면 구성과 디자인을 두 환경 모두에서 제공

## 메모 데이터 구조

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | 고유 식별자 |
| `category_name` | string | 메모가 속한 카테고리 (예: 영화, 맛집) |
| `memo` | string | 본문, 제목, URL 등 |
| `alarm_date` | string? | 푸시 알림 예약 날짜(ISO) — 선택 |
| `tag` | string[] | 태그 목록 |
| `createDate` | string | 생성 일시(ISO) |

## 프로젝트 구조

```
PrivateMemo/
├── class-mobile/   # Expo (React Native) + Expo Router + NativeWind
└── class-web/      # Next.js (App Router) + Tailwind CSS
```

두 프로젝트 모두 동일한 5개 화면을 가집니다.

| 탭 | 역할 |
| --- | --- |
| 🏠 홈 | 검색바 + 최근 메모 리스트 |
| 🗂️ 카테고리 | 카테고리 그리드, 사용자 추가, 카테고리별 메모 보기 |
| ➕ 추가 | 카테고리·내용·태그·알람 입력 폼 |
| 🔔 알림 | 알람 예약된 메모만 모아 보기 (날짜순) |
| ⚙️ 설정 | 환경 설정, 데이터 관리, 정보 |

## 기술 스택

### class-mobile
- Expo SDK 54 / Expo Router 6
- React 19, React Native 0.81
- NativeWind 4 (Tailwind CSS v3 preset)
- TypeScript

### class-web
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- TypeScript

> 두 클라이언트 모두 같은 유틸리티 클래스 네이밍(`flex-1`, `bg-white`, `rounded-2xl` 등)을 사용해 시각적 일관성을 유지합니다.

## 시작하기

### 사전 준비
- Node.js 20 이상
- npm 10 이상
- (모바일) iOS 시뮬레이터 또는 Android 에뮬레이터, 혹은 Expo Go 앱이 설치된 실기기

### 모바일 앱 실행

```bash
cd class-mobile
npm install
npm start
```

이후 콘솔의 안내에 따라 `i`(iOS), `a`(Android), `w`(웹)를 입력하거나 QR 코드를 Expo Go로 스캔합니다.

### 웹 앱 실행

```bash
cd class-web
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 폴더 구조 상세

### class-mobile
```
class-mobile/
├── app/
│   ├── _layout.tsx              # 루트 레이아웃 (전역 CSS 로드)
│   └── (tabs)/
│       ├── _layout.tsx          # 5탭 정의
│       ├── index.tsx            # 홈
│       ├── categories.tsx       # 카테고리
│       ├── add.tsx              # 메모 추가
│       ├── alarms.tsx           # 알림
│       └── settings.tsx         # 설정
├── components/
│   ├── screen-header.tsx        # 공통 상단 헤더
│   └── memo-card.tsx            # 메모 카드
├── lib/
│   └── mock-data.ts             # 타입 + 더미 데이터
├── tailwind.config.js
├── global.css
├── babel.config.js              # nativewind/babel 프리셋
├── metro.config.js              # withNativeWind 적용
└── nativewind-env.d.ts
```

### class-web
```
class-web/
├── app/
│   ├── layout.tsx
│   ├── globals.css              # Tailwind + 브랜드 컬러 토큰
│   ├── page.tsx                 # 홈
│   ├── categories/page.tsx
│   ├── add/page.tsx
│   ├── alarms/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── AppShell.tsx             # 헤더 + 하단 5탭 셸
│   └── MemoCard.tsx
└── lib/
    └── mock-data.ts             # 모바일과 동일한 스키마
```

## 현재 단계

✅ UI 구성 (현재 단계 — 더미 데이터로 동작)
- 5개 화면, 카테고리 추가/선택, 검색, 폼 입력 모두 동작
- 모바일/웹 동일 디자인, 동일한 데이터 모델 사용

## 다음 단계 로드맵

- [ ] 데이터 영속화 — `AsyncStorage` 또는 `expo-sqlite`
- [ ] 푸시 알림 실제 등록 — `expo-notifications`
- [ ] 웹 ↔ 모바일 데이터 동기화 (백엔드 또는 클라우드)
- [ ] 다크 모드 토글
- [ ] 메모 상세/편집 화면
- [ ] 데이터 가져오기/내보내기 (JSON)
- [ ] 앱 잠금 (생체 인증)

## 라이선스

이 저장소의 코드와 문서는 **[크리에이티브 커먼즈 저작자표시-비영리 4.0 국제 (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.ko)** 라이선스로 배포됩니다.

[![CC BY-NC 4.0](https://licensebuttons.net/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/deed.ko)

요약:
- ✅ **공유** — 어떤 매체나 형식으로든 자유롭게 복제·배포 가능
- ✅ **변경** — 자유롭게 리믹스, 변형 및 2차적 저작물 작성 가능
- ⚠️ **저작자 표시 (BY)** — 적절한 출처와 라이선스 링크를 표기해야 함
- 🚫 **비영리 (NC)** — 영리적 목적으로 이용할 수 없음

전체 라이선스 본문은 [`LICENSE`](./LICENSE) 파일과 [공식 deed](https://creativecommons.org/licenses/by-nc/4.0/deed.ko)를 참고하세요.
