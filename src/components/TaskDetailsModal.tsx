import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus, updateTaskDetails, softDeleteTask, updateTaskStatus } from '../firebase/tasks';
import { TEAM_MEMBERS, getMemberColors, getInitials } from '../utils/teamConstants';
import { formatDateTime, formatDate } from '../utils/dateUtils';
import { useToast } from './ToastContext';

interface TaskDetailsModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State for Edit mode
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [extendedDate, setExtendedDate] = useState('');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();

  // Initialize or update form state when task changes (preserving active user edits if isEditing)
  useEffect(() => {
    if (task && !isEditing) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssignedTo(task.assignedTo || TEAM_MEMBERS[0]);
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setDueDate(task.dueDate || '');
      setExtendedDate(task.extendedDate || '');
      setNotes(task.notes || '');
    }
  }, [task, isEditing]);

  // Reset modal view states when opened or switched to a different task
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required.', 'error');
      return;
    }

    try {
      setLoading(true);
      await updateTaskDetails(task.id, {
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        priority,
        status,
        dueDate: dueDate || null,
        extendedDate: extendedDate || null,
        notes: notes.trim(),
      });
      showToast('Task updated successfully!', 'success');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Update task failed:', err);
      showToast(err.message || 'Failed to update task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateTaskStatus(task.id, nextStatus);
      const msg = nextStatus === 'completed' ? 'Task marked as completed!' : 'Task reopened to pending!';
      showToast(msg, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await softDeleteTask(task.id);
      showToast('Task deleted successfully (preserved in archive).', 'info');
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const memberColors = getMemberColors(task.assignedTo);
  const initials = getInitials(task.assignedTo);

  const createdAtText = formatDateTime(task.createdAt);
  const completedAtText = task.completedAt ? formatDateTime(task.completedAt) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                task.priority === 'high'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : task.priority === 'medium'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {task.priority} Priority
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                task.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : task.status === 'in-progress'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {task.status.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Edit Task"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm ? (
          <div className="my-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-rose-900">
              Are you sure you want to delete this task?
            </h4>
            <p className="mt-1 text-xs text-rose-700">
              This task will be archived and removed from the active dashboard.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-500"
              >
                {loading ? 'Deleting...' : 'Yes, Delete Task'}
              </button>
            </div>
          </div>
        ) : isEditing ? (
          /* Edit Mode Form */
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Task Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Assigned Member
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Extended Date (If Exceeded)
                </label>
                <input
                  type="date"
                  value={extendedDate}
                  onChange={(e) => setExtendedDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="mt-5 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{task.title}</h3>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>

            {/* Due Date & Extended Date details */}
            {(task.dueDate || task.extendedDate) && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs">
                {task.dueDate && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="font-semibold text-slate-900">Target Due Date:</span>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                )}
                {task.extendedDate && (
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <span className="font-semibold text-amber-900">Extended Date:</span>
                    <span>{formatDate(task.extendedDate)}</span>
                  </div>
                )}
              </div>
            )}

            {task.notes && (
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-800">Notes:</span> {task.notes}
              </div>
            )}

            {/* Member Card */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs ring-2 ${memberColors.bg} ${memberColors.text} ${memberColors.ring}`}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Assigned To: {task.assignedTo}</p>
                  <p className="text-[11px] text-slate-400">Created by {task.assignedBy || 'Team'}</p>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <div className="flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" />
                  <span>{createdAtText}</span>
                </div>
                {completedAtText && (
                  <p className="text-emerald-600 font-medium mt-0.5">Done: {completedAtText}</p>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Task</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                    task.status === 'completed'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : task.status === 'completed' ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reopen Task</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark as Done</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

