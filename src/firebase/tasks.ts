import {
  collection,
  addDoc,
  updateDoc,
  doc,
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

export interface TaskSyncMetadata {
  hasPendingWrites: boolean;
  fromCache: boolean;
}

/**
 * Real-time listener for active tasks from Firestore (filtered for non-deleted tasks).
 * Does not use server-side orderBy to avoid omitting documents missing createdAt.
 * Emits metadata to track whether writes are pending or synced.
 */
export const subscribeToTasks = (
  callback: (tasks: TaskItem[], metadata: TaskSyncMetadata) => void,
  onError?: (error: Error) => void
) => {
  const tasksRef = collection(db, 'tasks');

  return onSnapshot(
    tasksRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      const metadata: TaskSyncMetadata = {
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache,
      };

      const tasks: TaskItem[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as TaskDocument & { deleted?: boolean }),
        }))
        .filter((t) => !t.deleted); // Exclude soft-deleted tasks from active view

      callback(tasks, metadata);
    },
    (error) => {
      console.error('Error fetching tasks from Firestore:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Real-time listener for ALL tasks including deleted ones (for History / Archives).
 * Does not use server-side orderBy to prevent accidental exclusion of historical records.
 */
export const subscribeToAllTasks = (
  callback: (tasks: TaskItem[], metadata: TaskSyncMetadata) => void,
  onError?: (error: Error) => void
) => {
  const tasksRef = collection(db, 'tasks');

  return onSnapshot(
    tasksRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      const metadata: TaskSyncMetadata = {
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache,
      };

      const tasks: TaskItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data({ serverTimestamps: 'estimate' }) as TaskDocument & { deleted?: boolean }),
      }));

      callback(tasks, metadata);
    },
    (error) => {
      console.error('Error fetching all tasks from Firestore:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Create a new daily task with server timestamp for createdAt and default pending status.
 * Awaits the addDoc write to guarantee it is submitted to Firestore.
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

  const docRef = await addDoc(tasksRef, newTask);
  return docRef;
};

/**
 * Update task status (e.g. pending -> in-progress -> completed, or reopen back to pending).
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
 * Does not physically purge records from Firestore.
 */
export const softDeleteTask = async (taskId: string) => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    deleted: true,
    deletedAt: serverTimestamp(),
  });
};
