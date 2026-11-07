import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { subscribeToTasks, TaskItem } from '../firebase/tasks';
import { StatsSummary } from '../components/StatsSummary';
import { TaskFilters, FilterState } from '../components/TaskFilters';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { TaskCardSkeleton } from '../components/Skeletons';
import { isDateInRange } from '../utils/dateUtils';
import { Plus, CheckSquare, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const memberName =
    userProfile?.name ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Team Member';

  // Real-time Firestore subscription (automatically excludes soft-deleted tasks)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTasks(
      (items) => {
        // Sort: active tasks first, completed tasks pushed down, ordered by createdAt
        const sorted = [...items].sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

        setTasks(sorted);
        setLoading(false);

        // Keep selectedTask modal state synced if updated in Firestore
        setSelectedTask((prev) => (prev ? sorted.find((t) => t.id === prev.id) || null : null));
      },
      (err) => {
        console.error('Failed to stream tasks:', err);
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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Team Daily Task Portal
            </span>
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

      {/* 4. Task Grid / Empty State */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={(clickedTask) => setSelectedTask(clickedTask)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <CheckSquare className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No tasks found</h3>
            <p className="mt-1.5 max-w-sm mx-auto text-sm text-slate-500">
              {tasks.length === 0
                ? "No tasks have been added yet. Click 'Add Task' to assign the first task to your team."
                : 'No tasks matched your active filter or search criteria.'}
            </p>
            {tasks.length > 0 ? (
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Task</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        assignedBy={memberName}
      />

      {/* Task Details & Edit Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};
