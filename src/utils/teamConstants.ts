export const TEAM_MEMBERS = [
  'Harshal Bhagat',
  'Swayam Thakur',
  'Daksh Patil',
  'Atharv Bhagat'
] as const;

export type TeamMemberName = typeof TEAM_MEMBERS[number];

// Fixed palette colors for consistent member avatars
export const MEMBER_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'Harshal Bhagat': { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-300' },
  'Swayam Thakur': { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  'Daksh Patil': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' },
  'Atharv Bhagat': { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-300' },
};

export const getMemberColors = (name: string) => {
  return MEMBER_COLORS[name] || { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-300' };
};

export const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
