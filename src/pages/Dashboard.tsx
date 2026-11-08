import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { subscribeToTasks, TaskItem, TaskSyncMetadata } from '../firebase/tasks';
import { StatsSummary } from '../components/StatsSummary';
import { TaskFilters, FilterState } from '../components/TaskFilters';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { TaskCardSkeleton } from '../components/Skeletons';
import { isDateInRange, toDateObject } from '../utils/dateUtils';
import { TEAM_MEMBERS, getMemberColors, getInitials } from '../utils/teamConstants';
import { Plus, CheckSquare, Sparkles, Cloud, CloudOff, AlertTriangle, Loader2, ChevronDown, ChevronRight, Inbox, CheckCircle2, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncMeta, setSyncMeta] = useState<TaskSyncMetadata | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    member: 'all',
    status: 'all',
    dateRange: 'all',
    searchQuery: '',
  });

  // Collapsible sections state: track collapsed members (false = expanded by default)
  const [collapsedMembers, setCollapsedMembers] = useState<Record<string, boolean>>({});

  const toggleMemberCollapse = (member: string) => {
    setCollapsedMembers((prev) => ({
      ...prev,
      [member]: !prev[member],
    }));
  };

  const memberName =
    userProfile?.name ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Team Member';

  // Real-time Firestore subscription (automatically excludes soft-deleted tasks)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTasks(
      (items, meta) => {
        // Robust sort using toDateObject: active first, then completed, ordered newest first
        const sorted = [...items].sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          const aTime = toDateObject(a.createdAt)?.getTime() || 0;
          const bTime = toDateObject(b.createdAt)?.getTime() || 0;
          return bTime - aTime;
        });

        setTasks(sorted);
        setSyncMeta(meta);
        setFirestoreError(null);
        setLoading(false);

        // Keep selectedTask modal state synced if updated in Firestore
        setSelectedTask((prev) => (prev ? sorted.find((t) => t.id === prev.id) || null : null));
      },
      (err) => {
        console.error('Failed to stream tasks from Cloud Firestore:', err);
        setFirestoreError(err?.message || 'Failed to connect to Cloud Firestore.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Summary counts across all active tasks
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  // Filtered task items
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Filter by member
      if (filters.member !== 'all' && task.assignedTo !== filters.member) {
        return false;
      }

      // 2. Filter by status
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // 3. Filter by search query
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const notesMatch = task.notes?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !notesMatch) {
          return false;
        }
      }

      // 4. Filter by date range (checks createdAt and dueDate/extendedDate)
      if (filters.dateRange !== 'all') {
        const deadline = task.extendedDate || task.dueDate;
        if (!isDateInRange(task.createdAt, filters.dateRange, deadline)) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  // Determine which member sections should be visible based on filter
  const visibleMembers = useMemo(() => {
    if (filters.member === 'all') {
      return [...TEAM_MEMBERS];
    }
    return TEAM_MEMBERS.filter((m) => m === filters.member);
  }, [filters.member]);

  // Group filtered tasks by member name
  const tasksByMember = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    visibleMembers.forEach((member) => {
      map[member] = [];
    });

    filteredTasks.forEach((task) => {
      if (map[task.assignedTo]) {
        map[task.assignedTo].push(task);
      } else if (filters.member === 'all' || filters.member === task.assignedTo) {
        // Fallback for any task assigned to an account outside predefined list (e.g. Kaalvion Admin)
        if (!map[task.assignedTo]) {
          map[task.assignedTo] = [];
        }
        map[task.assignedTo].push(task);
      }
    });

    return map;
  }, [filteredTasks, visibleMembers, filters.member]);

  // Ordered list of member keys to display
  const displayMemberKeys = useMemo(() => {
    const keys = [...visibleMembers];
    // Include any extra members found in tasksByMember that aren't in visibleMembers
    Object.keys(tasksByMember).forEach((key) => {
      if (!keys.includes(key as any)) {
        keys.push(key as any);
      }
    });
    return keys;
  }, [visibleMembers, tasksByMember]);

  const handleResetFilters = () => {
    setFilters({
      member: 'all',
      status: 'all',
      dateRange: 'all',
      searchQuery: '',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* 1. Header with team branding and active user */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Team Daily Task Portal
            </span>

            {/* Cloud Firestore Connection & Synchronization State Indicator */}
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
            Welcome back, {memberName}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage daily assignments, update task states, and track team progress in real time.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
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

      {/* 2. Stats summary cards */}
      <StatsSummary
        total={stats.total}
        pending={stats.pending}
        inProgress={stats.inProgress}
        completed={stats.completed}
      />

      {/* 3. Filter Bar */}
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* 4. Member-Wise Task Sections */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <TaskCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredTasks.length === 0 && filters.member !== 'all' ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No tasks found for {filters.member}</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            No tasks match your selected filter criteria. Try resetting filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : filteredTasks.length === 0 && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No tasks found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            No active tasks yet. Click "Add Task" to assign work to your team.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayMemberKeys.map((member) => {
            const memberTasks = tasksByMember[member] || [];
            const isCollapsed = !!collapsedMembers[member];
            const colors = getMemberColors(member);
            const initials = getInitials(member);
            const taskCount = memberTasks.length;
            const completedCount = memberTasks.filter((t) => t.status === 'completed').length;
            const activeCount = taskCount - completedCount;

            return (
              <section
                key={member}
                aria-label={`Tasks assigned to ${member}`}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-slate-300"
              >
                {/* Collapsible Header */}
                <button
                  type="button"
                  onClick={() => toggleMemberCollapse(member)}
                  className="w-full flex items-center justify-between p-4 sm:px-6 bg-white hover:bg-slate-50/70 transition-colors text-left border-b border-slate-100 cursor-pointer select-none"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Avatar Initials Badge with official member color palette */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm tracking-wide shadow-xs ring-2 ${colors.bg} ${colors.text} ${colors.ring}`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-slate-900 tracking-tight">
                          {member}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          ({initials})
                        </span>
                      </div>
                      
                      {/* Secondary status breakdown */}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {taskCount === 0 ? (
                          <span>0 active tasks</span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {activeCount} active
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              {completedCount} done
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Task Count Badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        taskCount > 0
                          ? `${colors.bg} ${colors.text} ${colors.ring}`
                          : 'bg-slate-100 text-slate-500 ring-slate-200'
                      }`}
                    >
                      {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
                    </span>

                    {/* Chevron Indicator with smooth transition */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-in-out" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 ease-in-out" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Collapsible Content with smooth CSS grid transition to prevent layout jumping */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-250 ease-in-out ${
                    isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 sm:p-6 bg-slate-50/40">
                      {memberTasks.length === 0 ? (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-3.5 px-4 text-slate-600">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Inbox className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">
                              No tasks for {member}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {filters.status !== 'all' || filters.searchQuery || filters.dateRange !== 'all'
                                ? 'No tasks match current filter criteria.'
                                : 'No active tasks assigned.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {memberTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={(clickedTask) => setSelectedTask(clickedTask)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 5. Modals */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        assignedBy={memberName}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};
