import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Timestamp } from 'firebase/firestore';

/**
 * ============================================================================
 * FIRESTORE SECURITY RULES
 * ============================================================================
 * Paste the following rules into your Firebase Console:
 * Firebase Console -> Firestore Database -> Rules -> Publish
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Helper function to verify user is authenticated
 *     function isAuthenticated() {
 *       return request.auth != null;
 *     }
 *
 *     // Users collection:
 *     // Authenticated users can read member profiles (for assigning tasks/showing team).
 *     // Each user can only write/update their own profile.
 *     match /users/{userId} {
 *       allow read: if isAuthenticated();
 *       allow write: if isAuthenticated() && request.auth.uid == userId;
 *     }
 *
 *     // Tasks collection:
 *     // All 4 authenticated team members can read, create, update, and manage tasks.
 *     match /tasks/{taskId} {
 *       allow read, create, update, delete: if isAuthenticated();
 *     }
 *   }
 * }
 * ============================================================================
 */

// Replace these placeholder values with your real Firebase Project keys
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9yLNCgM_mPNu1HrSdz1K3z6EhsEXTlUg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "web-dashboard-94647.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "web-dashboard-94647",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "web-dashboard-94647.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "256496756173",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:256496756173:web:649eb4c23912e48bf75084",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-31K8K8JM0N"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication (Email/Password)
export const auth = getAuth(app);

// Initialize Cloud Firestore with persistent local cache for instant reads and responsive writes
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// ============================================================================
// Firestore Data Types & Interfaces
// ============================================================================

/**
 * users collection schema:
 * {userId} -> { name, email, role, createdAt }
 */
export interface UserDocument {
  name: string;
  email: string;
  role: "member";
  createdAt: Timestamp;
}

/**
 * tasks collection schema:
 * {taskId} -> { title, description, assignedTo, assignedBy, status, priority, createdAt, completedAt, notes }
 */
export interface TaskDocument {
  title: string;
  description: string;
  assignedTo: string; // member name
  assignedBy: string; // member name or email
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  dueDate?: string | null; // Target completion date YYYY-MM-DD
  extendedDate?: string | null; // Extended deadline date YYYY-MM-DD
  notes?: string;
}

