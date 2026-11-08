export const TEAM_MEMBERS = [
  'Harshal Bhagat',
  'Swayam Thakur',
  'Daksh Patil',
  'Atharv Bhagat'
] as const;

export type TeamMemberName = typeof TEAM_MEMBERS[number];

export interface TeamAccountInfo {
  name: string;
  email: string;
  uid: string;
  role: 'member' | 'admin';
}

/**
 * Official Firebase Authentication Accounts mapped to their verified UIDs & Gmail addresses.
 */
export const OFFICIAL_TEAM_ACCOUNTS: Record<string, TeamAccountInfo> = {
  'YAeP6c3JHtRj6aJzIUuHLNJsqL13': {
    name: 'Harshal Bhagat',
    email: 'harshal@gmail.com',
    uid: 'YAeP6c3JHtRj6aJzIUuHLNJsqL13',
    role: 'member',
  },
  'ey0O1eJCHxd6Mn2y6KKRYTQvLWh2': {
    name: 'Swayam Thakur',
    email: 'swayam@gmail.com',
    uid: 'ey0O1eJCHxd6Mn2y6KKRYTQvLWh2',
    role: 'member',
  },
  'pYffmarasycB7klDJ1eaGjM9xvo2': {
    name: 'Daksh Patil',
    email: 'daksh@gmail.com',
    uid: 'pYffmarasycB7klDJ1eaGjM9xvo2',
    role: 'member',
  },
  'ml4FyajmXDZqeSYKHy9ycrTtJfU2': {
    name: 'Atharv Bhagat',
    email: 'atharv@gmail.com',
    uid: 'ml4FyajmXDZqeSYKHy9ycrTtJfU2',
    role: 'member',
  },
  'PlOcmP9KKLc1lf8ROjIflAyYcME3': {
    name: 'Kaalvion Admin',
    email: 'kaalvion@gmail.com',
    uid: 'PlOcmP9KKLc1lf8ROjIflAyYcME3',
    role: 'admin',
  },
};

/**
 * Helper to look up an official team account by either its UID or email address (case-insensitive).
 */
export const getAccountByEmailOrUid = (emailOrUid?: string | null): TeamAccountInfo | undefined => {
  if (!emailOrUid) return undefined;
  if (OFFICIAL_TEAM_ACCOUNTS[emailOrUid]) return OFFICIAL_TEAM_ACCOUNTS[emailOrUid];
  const lower = emailOrUid.toLowerCase().trim();
  return Object.values(OFFICIAL_TEAM_ACCOUNTS).find(
    (acc) => acc.email.toLowerCase() === lower
  );
};

// Fixed palette colors for consistent member avatars
export const MEMBER_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'Harshal Bhagat': { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-300' },
  'Swayam Thakur': { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  'Daksh Patil': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' },
  'Atharv Bhagat': { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-300' },
  'Kaalvion Admin': { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-300' },
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
