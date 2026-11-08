import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, UserDocument } from './firebase';
import { getAccountByEmailOrUid } from '../utils/teamConstants';

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserDocument | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Release route loading screen IMMEDIATELY so page renders with zero delay
      setLoading(false);

      if (user) {
        // Match verified account by UID or Gmail address, falling back to email prefix
        const matched = getAccountByEmailOrUid(user.uid) || getAccountByEmailOrUid(user.email || '');
        const nameFromEmail = user.email ? user.email.split('@')[0] : 'Team Member';
        const formattedName = matched?.name || user.displayName || (nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
        const role = (matched?.role || 'member') as 'member';
        
        setUserProfile({
          name: formattedName,
          email: user.email || '',
          role: role,
          createdAt: null as any
        });

        // Fetch custom firestore user document asynchronously in the background
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef)
          .then((docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserDocument);
            }
          })
          .catch((error) => {
            console.warn("Could not fetch user profile from Firestore:", error);
          });
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
