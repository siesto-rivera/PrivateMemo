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
  repeat: Repeat;
  tag: string[];
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
