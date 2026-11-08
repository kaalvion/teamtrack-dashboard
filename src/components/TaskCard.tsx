import React, { useState } from 'react';
import { TaskItem, TaskStatus, TaskPriority, updateTaskStatus, softDeleteTask } from '../firebase/tasks';
import { getMemberColors, getInitials } from '../utils/teamConstants';
import { formatDateTime, formatDate, isTaskOverdue } from '../utils/dateUtils';
import { Calendar, CheckCircle2, RotateCcw, Trash2, Check, AlertTriangle, Play } from 'lucide-react';
import { useToast } from './ToastContext';

interface TaskCardProps {
  task: TaskItem;
  onClick: (task: TaskItem) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showToast } = useToast();

  const memberColors = getMemberColors(task.assignedTo);
  const initials = getInitials(task.assignedTo);
  const isCompleted = task.status === 'completed';
  const isOverdue = isTaskOverdue(task.dueDate, task.extendedDate, isCompleted);

  // Quick mark as done / reopen action
  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const nextStatus: TaskStatus = isCompleted ? 'pending' : 'completed';
      await updateTaskStatus(task.id, nextStatus);
      showToast(
        isCompleted
          ? `Task "${task.title}" reopened to pending.`
          : `Task "${task.title}" marked as completed!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update task status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await updateTaskStatus(task.id, 'in-progress');
      showToast(`Task "${task.title}" is now In-Progress!`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update task status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      setShowDeleteConfirm(false);
      showToast(`Deleting task...`, 'info');
      await softDeleteTask(task.id);
      showToast(`Task "${task.title}" deleted (archived).`, 'info');
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      showToast(err?.message || 'Failed to delete task. Check Firestore rules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Status Badge configurations
  const statusConfig: Record<TaskStatus, { label: string; badge: string; dot: string }> = {
    pending: {
      label: 'Pending',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    'in-progress': {
      label: 'In Progress',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    completed: {
      label: 'Completed',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
  };

  // Priority Badge configurations
  const priorityConfig: Record<TaskPriority, { label: string; badge: string }> = {
    high: {
      label: 'High',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    medium: {
      label: 'Medium',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    low: {
      label: 'Low',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
    },
  };

  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  const createdAtText = formatDateTime(task.createdAt);
  const completedAtText = task.completedAt ? formatDateTime(task.completedAt) : null;

  return (
    <div
      onClick={() => onClick(task)}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all cursor-pointer hover:shadow-md ${
        isCompleted
          ? 'border-emerald-200/80 bg-emerald-50/20 opacity-85 hover:opacity-100 hover:border-emerald-300'
          : 'border-slate-200 bg-white hover:border-indigo-200'
      }`}
    >
      <div>
        {/* Top badges & delete icon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priority.badge}`}
            >
              {priority.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>

            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>

          {/* Quick delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            title="Delete task"
            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Task Title */}
        <h4
          className={`mt-3 text-base font-semibold leading-snug line-clamp-2 transition-colors ${
            isCompleted
              ? 'text-slate-700 line-through decoration-slate-400'
              : 'text-slate-900 group-hover:text-indigo-600'
          }`}
        >
          {task.title}
        </h4>

        {/* Description Preview */}
        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {task.description || 'No description provided.'}
        </p>

        {/* Target Due Date & Extended Date badges */}
        {(task.dueDate || task.extendedDate) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border ${
                task.extendedDate 
                  ? 'border-slate-200 bg-slate-50 text-slate-500 line-through' 
                  : isOverdue 
                  ? 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' 
                  : 'border-indigo-100 bg-indigo-50 text-indigo-700 font-medium'
              }`}>
                Due: {formatDate(task.dueDate)}
              </span>
            )}
            {task.extendedDate && (
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border font-semibold ${
                isOverdue
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                Extended: {formatDate(task.extendedDate)}
              </span>
            )}
          </div>
        )}

        {/* Notes (if any) */}
        {task.notes && (
          <div className="mt-2.5 rounded-lg bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-500 border border-slate-100 italic line-clamp-1">
            "{task.notes}"
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {/* Assigned Member & Mark-as-done / Reopen button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ring-2 ${memberColors.bg} ${memberColors.text} ${memberColors.ring}`}
              title={task.assignedTo}
            >
              {initials}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {task.assignedTo}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                by {task.assignedBy || 'Team'}
              </p>
            </div>
          </div>

          {/* Action buttons: Start (In-Progress) and Mark Done / Reopen */}
          <div className="flex items-center gap-1.5">
            {task.status === 'pending' && (
              <button
                type="button"
                onClick={handleStartWork}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer shadow-2xs"
                title="Mark as In-Progress"
              >
                <Play className="h-3 w-3 fill-blue-700" />
                <span>Start</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${
                isCompleted
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isCompleted ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reopen</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Mark Done</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dates */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            {createdAtText}
          </span>
          {completedAtText && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Completed: {completedAtText}
            </span>
          )}
        </div>
      </div>

      {/* Inline delete confirmation prompt overlay */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/95 p-5 text-center shadow-md animate-in fade-in duration-150"
        >
          <p className="text-xs font-semibold text-slate-900">Delete this task?</p>
          <p className="mt-1 text-[11px] text-slate-500">Will be safely preserved in History.</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500 cursor-pointer shadow-xs disabled:opacity-60"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
