import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToAllTasks, TaskItem, TaskSyncMetadata } from '../firebase/tasks';
import { TEAM_MEMBERS, getMemberColors, getInitials } from '../utils/teamConstants';
import { formatDateTime, isDateInRange, toDateObject } from '../utils/dateUtils';
import { generateTasksPDF, PDFTaskItem } from '../utils/pdfExport';
import { useToast } from '../components/ToastContext';
import { TableRowSkeleton } from '../components/Skeletons';
import {
  Download,
  Search,
  RotateCcw,
  History,
  CheckCircle2,
  Trash2,
  Loader2,
  FileSpreadsheet,
  Calendar,
  Cloud,
  CloudOff,
  AlertTriangle
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [syncMeta, setSyncMeta] = useState<TaskSyncMetadata | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Filters state
  const [memberFilter, setMemberFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(true);

  // Subscribe in real-time to all tasks (persisted in Firestore, sorted newest first)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllTasks(
      (items, meta) => {
        const sorted = [...items].sort((a, b) => {
          const aTime = toDateObject(a.createdAt)?.getTime() || 0;
          const bTime = toDateObject(b.createdAt)?.getTime() || 0;
          return bTime - aTime;
        });
        setTasks(sorted);
        setSyncMeta(meta);
        setFirestoreError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to stream task history:', err);
        setFirestoreError(err?.message || 'Failed to connect to Cloud Firestore.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter tasks based on active controls
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Show deleted tasks toggle
      if (!showDeleted && task.deleted) {
        return false;
      }

      // Member filter
      if (memberFilter !== 'all' && task.assignedTo !== memberFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'deleted') {
          if (!task.deleted) return false;
        } else if (task.status !== statusFilter || task.deleted) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const notesMatch = task.notes?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !notesMatch) return false;
      }

      // Date Range (checks createdAt and dueDate/extendedDate)
      if (dateRange !== 'all') {
        const deadline = task.extendedDate || task.dueDate;
        if (!isDateInRange(task.createdAt, dateRange, deadline)) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, memberFilter, statusFilter, dateRange, searchQuery, showDeleted]);

  // Handle PDF Export
  const handleDownloadPDF = () => {
    if (filteredTasks.length === 0) {
      showToast('No tasks to export with the current filters.', 'error');
      return;
    }

    try {
      setExporting(true);

      // Build readable filter criteria string for the PDF header
      const criteriaParts: string[] = [];
      criteriaParts.push(memberFilter === 'all' ? 'All Members' : `Member: ${memberFilter}`);
      criteriaParts.push(statusFilter === 'all' ? 'All Statuses' : `Status: ${statusFilter}`);
      criteriaParts.push(
        dateRange === 'all'
          ? 'Date: All Time'
          : dateRange === 'today'
          ? 'Date: Today'
          : dateRange === 'week'
          ? 'Date: This Week'
          : 'Date: This Month'
      );
      if (searchQuery.trim()) {
        criteriaParts.push(`Search: "${searchQuery.trim()}"`);
      }
      criteriaParts.push(showDeleted ? 'Including Deleted' : 'Excluding Deleted');
      const filterCriteriaText = criteriaParts.join('  •  ');

      // Map rows for the PDF table:
      // Columns: # | Task Title | Description | Assigned To | Priority | Status | Created Date | Completed Date
      const exportItems: PDFTaskItem[] = filteredTasks.map((t) => ({
        title: t.title,
        description: t.description || (t.notes ? `Note: ${t.notes}` : ''),
        assignedTo: t.assignedTo,
        priority: t.priority,
        status: t.deleted ? 'DELETED' : t.status,
        createdAt: formatDateTime(t.createdAt),
        completedAt: t.completedAt ? formatDateTime(t.completedAt) : '—',
      }));

      generateTasksPDF(exportItems, {
        portalName: 'TeamTrack Business Portal',
        reportTitle: 'Daily Task Report',
        filterCriteriaText,
      });

      showToast('PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleResetFilters = () => {
    setMemberFilter('all');
    setStatusFilter('all');
    setDateRange('all');
    setSearchQuery('');
    setShowDeleted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Header with Title and Prominent Download PDF Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-500/20">
              <History className="h-3.5 w-3.5" />
              Permanent Task Audit & Records
            </span>

            {/* Cloud Firestore Sync Status Indicator */}
            {syncMeta && !firestoreError && (
              syncMeta.hasPendingWrites ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/20">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Syncing to Cloud...
                </span>
              ) : syncMeta.fromCache ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-300/40">
                  <CloudOff className="h-3.5 w-3.5 text-slate-500" />
                  Offline (Cached view)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20">
                  <Cloud className="h-3.5 w-3.5" />
                  Cloud Synced
                </span>
              )
            )}
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Task History & Archives
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Complete lifecycle archive of all team tasks. Data is persisted in Cloud Firestore.
          </p>
        </div>

        <div>
          {/* Prominent Download PDF button with disabled state and loading indicator */}
          <button
            onClick={handleDownloadPDF}
            disabled={filteredTasks.length === 0 || exporting}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition cursor-pointer shadow-xs ${
              filteredTasks.length === 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
            }`}
            title={filteredTasks.length === 0 ? 'No tasks to export' : 'Download PDF report'}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Firestore Connection Error Banner */}
      {firestoreError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <span className="font-semibold">Cloud Connection Alert: </span>
            <span>{firestoreError} Tasks will save locally and sync once connection is restored.</span>
          </div>
        </div>
      )}

      {/* 2. Filter Bar with Show Deleted Tasks Toggle */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-center">
          {/* Keyword search */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by title, description or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Member filter */}
          <div className="lg:col-span-3">
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
            >
              <option value="all">All Members (4)</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="deleted">Deleted / Archived</option>
            </select>
          </div>

          {/* Date range filter */}
          <div className="lg:col-span-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Reset filter button */}
          <div className="flex justify-end lg:col-span-1">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition w-full justify-center"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="lg:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* Show Deleted Tasks Toggle & Active Count */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <input
              id="showDeletedToggle"
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="showDeletedToggle"
              className="text-xs font-medium text-slate-600 cursor-pointer select-none"
            >
              Show deleted tasks in audit log
            </label>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredTasks.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{tasks.length}</span> recorded tasks
          </div>
        </div>
      </div>


      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="p-6">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <tbody className="divide-y divide-slate-100 bg-white">
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </tbody>
              </table>
            </div>
            <div className="md:hidden flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">Loading audit records...</p>
            </div>
          </div>
        ) : filteredTasks.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Task Title & Description
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Assigned To
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Created By
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Priority
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Created Date
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Completed Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTasks.map((task) => {
                    const memberColors = getMemberColors(task.assignedTo);
                    const initials = getInitials(task.assignedTo);
                    const createdAtText = formatDateTime(task.createdAt);
                    const completedAtText = task.completedAt ? formatDateTime(task.completedAt) : null;

                    return (
                      <tr
                        key={task.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          task.deleted ? 'bg-rose-50/20 opacity-60' : ''
                        }`}
                      >
                        {/* Title & Description */}
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 leading-snug">
                              {task.title}
                            </span>
                            {task.deleted && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                <Trash2 className="h-3 w-3" />
                                Deleted
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          {task.notes && (
                            <p className="mt-1 text-[11px] text-slate-400 italic">
                              "{task.notes}"
                            </p>
                          )}
                        </td>

                        {/* Assigned To */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1 ${memberColors.bg} ${memberColors.text} ${memberColors.ring}`}
                              title={task.assignedTo}
                            >
                              {initials}
                            </div>
                            <span className="text-xs font-medium text-slate-800">
                              {task.assignedTo}
                            </span>
                          </div>
                        </td>

                        {/* Created By */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                          {task.assignedBy || 'Team Member'}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              task.status === 'completed'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : task.status === 'in-progress'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.status.replace('-', ' ')}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                              task.priority === 'high'
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : task.priority === 'medium'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {createdAtText}
                        </td>

                        {/* Completed Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                          {completedAtText ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {completedAtText}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const memberColors = getMemberColors(task.assignedTo);
                const initials = getInitials(task.assignedTo);
                const createdAtText = formatDateTime(task.createdAt);
                const completedAtText = task.completedAt ? formatDateTime(task.completedAt) : null;

                return (
                  <div
                    key={task.id}
                    className={`p-4 transition-colors ${
                      task.deleted ? 'bg-rose-50/20 opacity-60' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            task.priority === 'high'
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : task.priority === 'medium'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            task.status === 'completed'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : task.status === 'in-progress'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.status}
                        </span>

                        {task.deleted && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                            <Trash2 className="h-3 w-3" />
                            Deleted
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="mt-2 text-sm font-semibold text-slate-900">{task.title}</h4>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${memberColors.bg} ${memberColors.text} ${memberColors.ring}`}
                        >
                          {initials}
                        </div>
                        <span className="font-medium text-slate-800">{task.assignedTo}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">by {task.assignedBy}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {createdAtText}
                      </span>
                      {completedAtText && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done: {completedAtText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No tasks to export</h4>
            <p className="mt-1 text-xs text-slate-500">
              No tasks match your current filter or search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
