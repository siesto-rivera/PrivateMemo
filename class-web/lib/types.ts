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

export type Memo = {
  id: number;
  category_name: string;
  memo: string;
  alarm_date?: string | null;
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
