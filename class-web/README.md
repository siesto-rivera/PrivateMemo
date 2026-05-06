# 지극히 사적인 메모장 — 웹 (Next.js)

[Next.js](https://nextjs.org) 기반의 웹 클라이언트입니다. [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)으로 생성했으며, App Router와 Tailwind CSS v4를 사용합니다. 모바일 앱(`class-mobile`)과 동일한 5탭 구조 및 디자인을 공유합니다.

## 시작하기

먼저 개발 서버를 실행하세요.

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
# 또는
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어 결과를 확인합니다.

`app/page.tsx` 파일을 수정하면 페이지가 자동으로 갱신됩니다.

이 프로젝트는 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)를 사용해 [Geist](https://vercel.com/font) 폰트를 자동 최적화·로드합니다.

## 폴더 구조

```
app/
├── layout.tsx               # 루트 레이아웃
├── globals.css              # Tailwind + 브랜드 컬러 토큰
├── page.tsx                 # 홈 — 검색 + 최근 메모
├── categories/page.tsx      # 카테고리
├── add/page.tsx             # 메모 추가
├── alarms/page.tsx          # 알림 예약 모음
└── settings/page.tsx        # 설정
components/
├── AppShell.tsx             # 헤더 + 하단 5탭 셸 (max-w-md 폰 형태)
└── MemoCard.tsx             # 메모 카드
lib/
└── mock-data.ts             # 타입 + 더미 데이터 (모바일과 동일 스키마)
```

## 빌드

```bash
npm run build
npm run start
```

`npm run build`는 5개 페이지를 정적으로 prerender합니다.

## 더 알아보기

- [Next.js 공식 문서](https://nextjs.org/docs) — 기능과 API
- [Learn Next.js](https://nextjs.org/learn) — 인터랙티브 튜토리얼
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

[Next.js GitHub 저장소](https://github.com/vercel/next.js)에서 피드백과 기여를 환영합니다.

## Vercel에 배포하기

가장 간단한 배포 방법은 Next.js 제작자가 만든 [Vercel 플랫폼](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)을 사용하는 것입니다.

자세한 배포 옵션은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참고하세요.
