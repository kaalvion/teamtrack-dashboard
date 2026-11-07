import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, TaskDocument } from './firebase';

export interface TaskItem extends TaskDocument {
  id: string;
  deleted?: boolean;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Real-time listener for tasks from Firestore (filtered for non-deleted tasks).
 */
export const subscribeToTasks = (
  callback: (tasks: TaskItem[]) => void,
  onError?: (error: Error) => void
) => {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: TaskItem[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as TaskDocument & { deleted?: boolean }),
        }))
        .filter((t) => !t.deleted); // Exclude soft-deleted tasks from active view
      callback(tasks);
    },
    (error) => {
      console.error('Error fetching tasks from Firestore:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Real-time listener for ALL tasks including deleted ones (for History / Archives).
 */
export const subscribeToAllTasks = (
  callback: (tasks: TaskItem[]) => void,
  onError?: (error: Error) => void
) => {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: TaskItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as TaskDocument & { deleted?: boolean }),
      }));
      callback(tasks);
    },
    (error) => {
      console.error('Error fetching all tasks from Firestore:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Create a new daily task with server timestamp for createdAt and default pending status.
 */
export const createTask = async (
  title: string,
  description: string,
  assignedTo: string,
  assignedBy: string,
  priority: TaskPriority = 'medium',
  notes?: string,
  dueDate?: string | null,
  extendedDate?: string | null
) => {
  const tasksRef = collection(db, 'tasks');
  const newTask = {
    title,
    description: description || '',
    assignedTo,
    assignedBy: assignedBy || 'Team Member',
    status: 'pending' as TaskStatus,
    priority,
    notes: notes || '',
    dueDate: dueDate || null,
    extendedDate: extendedDate || null,
    createdAt: serverTimestamp(),
    completedAt: null,
    deleted: false,
  };
  return await addDoc(tasksRef, newTask);
};

/**
 * Update task status (e.g. pending -> completed, or reopen back to pending).
 */
export const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
  const taskRef = doc(db, 'tasks', taskId);
  const isCompleted = newStatus === 'completed';
  await updateDoc(taskRef, {
    status: newStatus,
    completedAt: isCompleted ? serverTimestamp() : null,
  });
};

/**
 * Update full task details in Edit mode.
 */
export const updateTaskDetails = async (
  taskId: string,
  updates: Partial<{
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    status: TaskStatus;
    notes?: string;
    dueDate?: string | null;
    extendedDate?: string | null;
  }>
) => {
  const taskRef = doc(db, 'tasks', taskId);
  const updatePayload: Record<string, any> = { ...updates };
  
  if (updates.status) {
    updatePayload.completedAt = updates.status === 'completed' ? serverTimestamp() : null;
  }

  await updateDoc(taskRef, updatePayload);
};

/**
 * Soft-delete a task: sets deleted: true and timestamp for audit preservation.
 */
export const softDeleteTask = async (taskId: string) => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    deleted: true,
    deletedAt: serverTimestamp(),
  });
};
