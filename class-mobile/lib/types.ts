export type User = {
  id: number;
  email: string;
  name: string;
  date_joined: string;
};

export type Category = {
  id: number;
  name: string;
  emoji: string;
};

export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';

export const REPEAT_LABELS: Record<Repeat, string> = {
  none: '반복 없음',
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
};

export type Memo = {
  id: number;
  category_name: string;
  memo: string;
  alarm_date?: string | null;
  schedule_date?: string | null; // YYYY-MM-DD
  repeat: Repeat;
  tag: string[];
  images: string[];
  createDate: string;
};

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

export type StickyPalette = {
  bg: string;
  border: string;
  tape: string;
  text: string;
  badge: string;
};

const STICKY_PALETTES: StickyPalette[] = [
  { bg: '#fef9c3', border: '#fde68a', tape: 'rgba(217, 119, 6, 0.35)', text: '#1f2937', badge: 'rgba(255,255,255,0.65)' }, // yellow
  { bg: '#fce7f3', border: '#fbcfe8', tape: 'rgba(190, 24, 93, 0.30)', text: '#1f2937', badge: 'rgba(255,255,255,0.7)' },  // pink
  { bg: '#dbeafe', border: '#bfdbfe', tape: 'rgba(29, 78, 216, 0.25)', text: '#1f2937', badge: 'rgba(255,255,255,0.7)' },  // blue
  { bg: '#dcfce7', border: '#bbf7d0', tape: 'rgba(22, 101, 52, 0.25)', text: '#1f2937', badge: 'rgba(255,255,255,0.7)' },  // green
  { bg: '#ffedd5', border: '#fed7aa', tape: 'rgba(154, 52, 18, 0.25)', text: '#1f2937', badge: 'rgba(255,255,255,0.7)' },  // orange
  { bg: '#ede9fe', border: '#ddd6fe', tape: 'rgba(91, 33, 182, 0.25)', text: '#1f2937', badge: 'rgba(255,255,255,0.7)' },  // lavender
  { bg: '#cffafe', border: '#a5f3fc', tape: 'rgba(14, 116, 144, 0.25)', text: '#1f2937', badge: 'rgba(255,255,255,0.7)' }, // cyan
  { bg: '#fee2e2', border: '#fecaca', tape: 'rgba(153, 27, 27, 0.25)', text: '#1f2937', badge: 'rgba(255,255,255,0.7)' },  // rose
];

const UNCATEGORIZED_PALETTE: StickyPalette = {
  bg: '#f3f4f6',
  border: '#e5e7eb',
  tape: 'rgba(75, 85, 99, 0.25)',
  text: '#1f2937',
  badge: 'rgba(255,255,255,0.7)',
};

export function stickyPalette(categoryName: string): StickyPalette {
  if (categoryName === '미분류') return UNCATEGORIZED_PALETTE;
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = (hash << 5) - hash + categoryName.charCodeAt(i);
    hash |= 0;
  }
  return STICKY_PALETTES[Math.abs(hash) % STICKY_PALETTES.length];
}
