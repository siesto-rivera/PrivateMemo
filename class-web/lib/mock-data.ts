export type Memo = {
  id: string;
  category_name: string;
  memo: string;
  alarm_date?: string;
  tag: string[];
  createDate: string;
};

export const DEFAULT_CATEGORIES = [
  '영화',
  '책',
  '주소',
  '맛집',
  '장소',
  '비번',
  '차량관리',
  '오토바이 관리',
  '집관리',
  '계좌 이벤트',
];

export const MOCK_MEMOS: Memo[] = [
  {
    id: '1',
    category_name: '영화',
    memo: '듄: 파트 2 — IMAX 재관람 예정',
    tag: ['SF', '재관람'],
    createDate: '2026-04-22T09:30:00Z',
  },
  {
    id: '2',
    category_name: '책',
    memo: '<프로젝트 헤일메리> — 원서 챕터 3까지',
    tag: ['SF', '원서'],
    createDate: '2026-04-25T14:10:00Z',
  },
  {
    id: '3',
    category_name: '맛집',
    memo: '연남동 라멘 — 평일 19시 이전 추천',
    tag: ['일식', '연남동'],
    createDate: '2026-04-28T20:00:00Z',
  },
  {
    id: '4',
    category_name: '계좌 이벤트',
    memo: '청약통장 만기 — 우리은행',
    alarm_date: '2026-06-15T09:00:00Z',
    tag: ['금융', '만기'],
    createDate: '2026-04-30T08:00:00Z',
  },
  {
    id: '5',
    category_name: '차량관리',
    memo: '엔진오일 교체 — 12,000km 도달 시',
    alarm_date: '2026-07-01T10:00:00Z',
    tag: ['소나타', '정비'],
    createDate: '2026-05-01T18:45:00Z',
  },
  {
    id: '6',
    category_name: '비번',
    memo: '공유기 관리자 페이지 — 라우터 뒷면 라벨 참조',
    tag: ['네트워크'],
    createDate: '2026-05-03T11:20:00Z',
  },
  {
    id: '7',
    category_name: '주소',
    memo: '본가 — 서울시 ○○구 △△로 12, 304호',
    tag: ['가족'],
    createDate: '2026-05-04T16:00:00Z',
  },
  {
    id: '8',
    category_name: '집관리',
    memo: '필터 교체 — 정수기 (3개월 주기)',
    alarm_date: '2026-08-04T09:00:00Z',
    tag: ['정수기'],
    createDate: '2026-05-05T08:15:00Z',
  },
];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export const CATEGORY_EMOJI: Record<string, string> = {
  영화: '🎬',
  책: '📚',
  주소: '🏠',
  맛집: '🍜',
  장소: '📍',
  비번: '🔑',
  차량관리: '🚗',
  '오토바이 관리': '🏍️',
  집관리: '🛠️',
  '계좌 이벤트': '💳',
};
