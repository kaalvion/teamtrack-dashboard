# 🚀 TeamTrack — Business Daily Task Tracking Portal

A clean, modern, and responsive Daily Task Tracking Web Application designed for a 4-member business core team. Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Firebase** (Authentication & Cloud Firestore).

---

## 📋 Features

- 🔒 **Private & Protected Portal**: Accessible only by authenticated team members with session persistence across page refreshes.
- 👥 **Team-Centric Tracking**: Pre-configured profiles and color-coded avatars for the 4 core team members:
  - *Harshal Bhagat* (Indigo)
  - *Swayam Thakur* (Emerald)
  - *Daksh Patil* (Amber)
  - *Atharv Bhagat* (Purple)
- 📊 **Real-Time Live Dashboard**:
  - Live metric summary cards: Total Tasks, Pending, In-Progress, Completed.
  - Multi-criteria filter bar: Filter by member, status, date range (Today, Week, Month, All Time), and keyword search.
  - Instant live card updates synced via Firestore `onSnapshot`.
- 📝 **Full Task Management**:
  - **Add Task Modal**: Create tasks with titles, descriptions, assignees, priorities (Low, Medium, High), and notes.
  - **Task Details & Edit Modal**: View complete lifecycle and edit tasks in place.
  - **Quick Mark as Done / Reopen**: Toggle task status directly from the card.
  - **Soft Delete**: Safeguards history by setting `deleted: true` rather than hard-deleting records.
  - **Toast Notifications**: Interactive toast alerts for creation, edits, completions, and deletions.
- 📜 **Audit & History Page (`/history`)**:
  - Shows every task ever created (including completed and deleted records with reduced opacity).
  - Responsive layout: clean table on desktop and compact card view on mobile.
- 📄 **Professional PDF Export**:
  - One-click "Download PDF" exporting active filtered views.
  - Built with `jspdf` and `jspdf-autotable`. Includes business header, filter details, 8-column data table, bottom summary totals, and page counters.
  - Auto-generated filename: `Task-Report_YYYY-MM-DD.pdf`.

---

## 🛠️ Step-by-Step Setup Guide (Beginner-Friendly)

### Step 1: Firebase Project Setup & Config Keys

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project** (or select your existing project).
2. Enter your project name (e.g. `web-dashboard-94647`) and follow the setup prompts (Google Analytics is optional).
3. In the project dashboard, click the **Web icon (`</>`)** to register a web app.
4. Give it a nickname and click **Register app**.
5. Firebase will display a `firebaseConfig` object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "123456789...",
     appId: "1:123456789...:web:...",
     measurementId: "G-..."
   };
   ```
6. Copy these values into the project root file named [`.env`](.env):
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
   *(Note: Fallback values are also maintained in `src/firebase/firebase.ts`.)*

---

### Step 2: Enable Email/Password Auth & Create the 4 Accounts

Since there is no public sign-up page (to keep your business portal strictly internal), the admin creates the accounts manually:

1. In the Firebase Console, go to **Build &rarr; Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable the first toggle (**Email/Password**) and click **Save**.
5. Switch to the **Users** tab and click the **Add user** button.
6. The 5 authorized team accounts in Firebase Authentication:
   - Member 1: `harshal@gmail.com` (UID: `YAeP6c3JHtRj6aJzIUuHLNJsqL13`)
   - Member 2: `swayam@gmail.com` (UID: `ey0O1eJCHxd6Mn2y6KKRYTQvLWh2`)
   - Member 3: `daksh@gmail.com` (UID: `pYffmarasycB7klDJ1eaGjM9xvo2`)
   - Member 4: `atharv@gmail.com` (UID: `ml4FyajmXDZqeSYKHy9ycrTtJfU2`)
   - Admin: `kaalvion@gmail.com` (UID: `PlOcmP9KKLc1lf8ROjIflAyYcME3`)
7. Share credentials with each member. They can log in directly on the `/login` page using their Gmail account.

---

### Step 3: Set Up Firestore & Paste Security Rules

1. In the Firebase Console, go to **Build &rarr; Firestore Database**.
2. Click **Create database**, choose a cloud location close to your team, and start in **Production mode**.
3. Click the **Rules** tab at the top of your Firestore Database screen.
4. Replace everything in the editor with these exact security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.uid == 'PlOcmP9KKLc1lf8ROjIflAyYcME3';
    }

    function isTeamMember() {
      return isAuthenticated() && (
        request.auth.uid == 'YAeP6c3JHtRj6aJzIUuHLNJsqL13' || // Harshal
        request.auth.uid == 'ey0O1eJCHxd6Mn2y6KKRYTQvLWh2' || // Swayam
        request.auth.uid == 'pYffmarasycB7klDJ1eaGjM9xvo2' || // Daksh
        request.auth.uid == 'ml4FyajmXDZqeSYKHy9ycrTtJfU2'    // Atharv
      );
    }

    function isAuthorizedUser() {
      return isTeamMember() || isAdmin();
    }

    match /users/{userId} {
      allow read: if isAuthorizedUser();
      allow write: if isAuthorizedUser() && (request.auth.uid == userId || isAdmin());
    }

    match /tasks/{taskId} {
      allow read, create, update: if isAuthorizedUser();
      allow delete: if false; // Permanent deletion disabled
    }
  }
}
```

5. Click **Publish**.

---

## 💻 Running the App Locally

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

1. Open your terminal in this project folder:
   ```bash
   cd dashboard
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5173/
   ```

---

## 🌐 How to Deploy the App

### Option A: Deploy to Firebase Hosting (Recommended)

1. Install the Firebase CLI tool globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to your Firebase account:
   ```bash
   firebase login
   ```
3. Initialize hosting in this project directory:
   ```bash
   firebase init hosting
   ```
   - Select your existing Firebase project (`web-dashboard-94647`).
   - When asked for your public directory, type: `dist`
   - Configure as a single-page app (rewrite all urls to `/index.html`)? &rarr; Type **Yes (`y`)**.
   - Set up automatic builds and deploys with GitHub? &rarr; Type **No (`N`)** (or Yes if desired).
4. Build the production package:
   ```bash
   npm run build
   ```
5. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```
   *Firebase will output your live URL (e.g. `https://web-dashboard-94647.web.app`).*

---

### Option B: Deploy to Vercel (Quick & Free)

1. Push your code to a GitHub repository (e.g. `https://github.com/your-username/dashboard`).
2. Go to [Vercel.com](https://vercel.com/) and log in.
3. Click **Add New &rarr; Project** and import your GitHub repository.
4. Under **Environment Variables**, add each variable from your `.env` file (`VITE_FIREBASE_API_KEY`, etc.).
5. Click **Deploy**. Vercel will build and provide a live URL in under 2 minutes.

---

## 📁 Project Structure

```
dashboard/
├── .env                         # Firebase credentials
├── index.html                   # HTML entry point with Inter font & viewport
├── package.json                 # Dependencies and build scripts
├── vite.config.ts               # Vite configuration with React & Tailwind plugins
├── src/
│   ├── App.tsx                  # Main router and route protection setup
│   ├── main.tsx                 # Root render with AuthProvider and ToastProvider
│   ├── style.css                # Tailwind CSS v4 styling & theme setup
│   ├── components/
│   │   ├── AddTaskModal.tsx     # Modal to create new tasks
│   │   ├── Navbar.tsx           # Global authenticated header with avatar & logout
│   │   ├── RouteGuards.tsx      # ProtectedRoute & PublicOnlyRoute
│   │   ├── Skeletons.tsx        # Skeleton loaders for cards & table rows
│   │   ├── StatsSummary.tsx     # Color-coded metric overview cards
│   │   ├── TaskCard.tsx         # Responsive task card with status badges & actions
│   │   ├── TaskDetailsModal.tsx # View full lifecycle & in-place edit mode
│   │   ├── TaskFilters.tsx      # Member, status, date, and keyword search filters
│   │   └── ToastContext.tsx     # Toast notifications (Success, Info, Error)
│   ├── firebase/
│   │   ├── firebase.ts          # Firebase app, Auth, Firestore init & types
│   │   ├── AuthContext.tsx      # User session provider (login, logout, state)
│   │   └── tasks.ts             # Real-time Firestore query subscriptions & CRUD
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main live tracking page
│   │   ├── History.tsx          # Permanent records & audit table with PDF export
│   │   └── Login.tsx            # Protected login page
│   └── utils/
│       ├── dateUtils.ts         # Timestamp formatter (e.g. 07 Nov 2026, 10:30 AM)
│       ├── pdfExport.ts         # Professional PDF generator using jsPDF & AutoTable
│       └── teamConstants.ts     # 4 member names, colors, and initials helpers
```

