/**
 * Parse any date representation (Firestore Timestamp, Date, string, number, or { seconds, nanoseconds })
 * into a valid JavaScript Date object, or null if invalid.
 */
export const toDateObject = (val: any): Date | null => {
  if (val === null || val === undefined) return null;

  // 1. If it's a Firestore Timestamp with toDate()
  if (typeof val?.toDate === 'function') {
    try {
      const d = val.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // fallback
    }
  }

  // 2. If it has toMillis()
  if (typeof val?.toMillis === 'function') {
    try {
      const ms = val.toMillis();
      if (typeof ms === 'number' && !isNaN(ms)) return new Date(ms);
    } catch {
      // fallback
    }
  }

  // 3. If it has seconds / nanoseconds (Firestore JSON format or local cache)
  if (typeof val?.seconds === 'number' && !isNaN(val.seconds)) {
    const millis = val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1000000) : 0);
    const d = new Date(millis);
    if (!isNaN(d.getTime())) return d;
  }

  // 4. If it has _seconds / _nanoseconds (alternative Firestore serialization)
  if (typeof val?._seconds === 'number' && !isNaN(val._seconds)) {
    const millis = val._seconds * 1000 + (val._nanoseconds ? Math.floor(val._nanoseconds / 1000000) : 0);
    const d = new Date(millis);
    if (!isNaN(d.getTime())) return d;
  }

  // 5. Native JavaScript Date instance
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // 6. Numeric timestamp (seconds or milliseconds)
  if (typeof val === 'number' && !isNaN(val)) {
    // If less than 100 billion, it's unix seconds; otherwise milliseconds
    const ms = val < 100_000_000_000 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // 7. String representation
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Specific check for Date-only YYYY-MM-DD to avoid UTC midnight timezone shifts
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const month = parseInt(dateOnlyMatch[2], 10) - 1;
      const day = parseInt(dateOnlyMatch[3], 10);
      const localDate = new Date(year, month, day, 0, 0, 0, 0);
      return isNaN(localDate.getTime()) ? null : localDate;
    }

    const d = new Date(trimmed);
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
      // Last 7 days or current week window (Sunday to Saturday)
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return (d >= startOfWeek && d <= endOfWeek) || d >= sevenDaysAgo;
    }

    if (range === 'month') {
      // Matches if within the current calendar month OR within the last 30 days
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return (d >= startOfMonth && d <= endOfMonth) || d >= thirtyDaysAgo;
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
export const formatDateTime = (date: any): string => {
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

export const formatDate = (date: any): string => {
  const d = toDateObject(date);
  if (!d) return 'N/A';

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
};

export const getTodayISOString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const deadline = toDateObject(deadlineStr);
  if (!deadline) return false;

  const endOfDeadline = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate(),
    23,
    59,
    59,
    999
  );
  return new Date() > endOfDeadline;
};
