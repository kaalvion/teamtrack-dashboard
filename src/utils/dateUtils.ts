/**
 * Parse any date representation (Firestore Timestamp, Date, string, number)
 * into a valid JavaScript Date object, or null if invalid.
 */
export const toDateObject = (val: any): Date | null => {
  if (!val) return null;
  // If it's a Firestore Timestamp with toDate()
  if (typeof val?.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      // fallback
    }
  }
  // If it has seconds / nanoseconds property (Firestore JSON format or local cache)
  if (typeof val?.seconds === 'number') {
    const d = new Date(val.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    // Check if ISO or YYYY-MM-DD
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/**
 * Checks whether a task falls within the selected date range.
 * Checks against:
 * 1. createdAt (when task was created)
 * 2. dueDate or extendedDate (target completion deadline)
 *
 * If either matches the target period, the task is included.
 */
export const isDateInRange = (
  dateVal: any,
  range: 'today' | 'week' | 'month' | 'all',
  fallbackDueDate?: string | null
): boolean => {
  if (range === 'all') return true;

  const dateObj = toDateObject(dateVal);
  const dueObj = fallbackDueDate ? toDateObject(fallbackDueDate) : null;

  // If neither date can be resolved (e.g. pending local cache latency), keep it visible
  if (!dateObj && !dueObj) return true;

  const now = new Date();

  const checkMatch = (d: Date): boolean => {
    if (range === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return d >= startOfToday && d <= endOfToday;
    }

    if (range === 'week') {
      // Last 7 days or current week window
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return (d >= startOfWeek && d <= endOfWeek) || d >= sevenDaysAgo;
    }

    if (range === 'month') {
      // Matches if within the current calendar month OR within the last 30 days
      const sameMonthAndYear = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return sameMonthAndYear || d >= thirtyDaysAgo;
    }

    return true;
  };

  // Match if either createdAt OR dueDate/extendedDate matches
  if (dateObj && checkMatch(dateObj)) return true;
  if (dueObj && checkMatch(dueObj)) return true;

  return false;
};

/**
 * Format a Date object, ISO string, or Firestore timestamp into a readable string:
 * e.g., "07 Nov 2026, 10:30 AM" or date-only "07 Nov 2026"
 */
export const formatDateTime = (date: Date | string | number | null | undefined): string => {
  const d = toDateObject(date);
  if (!d) return 'Recently';

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
};

export const formatDate = (date: Date | string | number | null | undefined): string => {
  const d = toDateObject(date);
  if (!d) return 'N/A';

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
};

export const getTodayISOString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Check if a task is overdue:
 * If task is not completed, and its effective deadline (extendedDate or dueDate) is in the past.
 */
export const isTaskOverdue = (
  dueDate?: string | null,
  extendedDate?: string | null,
  isCompleted?: boolean
): boolean => {
  if (isCompleted) return false;
  const deadlineStr = extendedDate || dueDate;
  if (!deadlineStr) return false;

  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return false;

  const endOfDeadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), 23, 59, 59, 999);
  return new Date() > endOfDeadline;
};
