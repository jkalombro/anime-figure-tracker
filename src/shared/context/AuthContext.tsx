import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut, updateProfile, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider, db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generateSalt, hashPassword, verifyPassword } from '../utils/crypto';

export interface AppUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  emailVerified?: boolean;
  username?: string;
  isCustomAuth?: boolean;
}

interface AuthContextType {
  user: User | AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  registerWithCredentials: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let customUserLoaded = false;
    const savedCustomUser = localStorage.getItem('kuradex_custom_auth');
    if (savedCustomUser) {
      try {
        const parsed = JSON.parse(savedCustomUser);
        if (parsed?.uid) {
          setUser(parsed);
          customUserLoaded = true;
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse cached custom user:', err);
        localStorage.removeItem('kuradex_custom_auth');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          const cached = localStorage.getItem('kuradex_custom_auth');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const customUser: AppUser = {
                ...parsed,
                uid: firebaseUser.uid,
              };
              localStorage.setItem('kuradex_custom_auth', JSON.stringify(customUser));
              setUser(customUser);
              setLoading(false);
              return;
            } catch {
              // ignore
            }
          }
        }

        localStorage.removeItem('kuradex_custom_auth');
        // Sync user profile including email and avatar
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              userId: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Collector',
              email: firebaseUser.email || null,
              photoURL: firebaseUser.photoURL || null,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
          } else {
            // Ensure email and profile data are backfilled if previously omitted
            const existingData = userDoc.data();
            const updates: Record<string, any> = {};
            if (firebaseUser.email && existingData?.email !== firebaseUser.email) {
              updates.email = firebaseUser.email;
            }
            if (firebaseUser.displayName && !existingData?.displayName) {
              updates.displayName = firebaseUser.displayName;
            }
            if (firebaseUser.photoURL && !existingData?.photoURL) {
              updates.photoURL = firebaseUser.photoURL;
            }
            updates.lastLoginAt = serverTimestamp();
            await setDoc(userRef, updates, { merge: true });
          }
        } catch (e) {
          console.warn('Could not sync user profile to Firestore:', e);
        }
        setUser(firebaseUser);
        setLoading(false);
      } else {
        if (!customUserLoaded) {
          const custom = localStorage.getItem('kuradex_custom_auth');
          if (custom) {
            try {
              setUser(JSON.parse(custom));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      localStorage.removeItem('kuradex_custom_auth');
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (
        error?.code === 'auth/cancelled-popup-request' ||
        error?.code === 'auth/popup-closed-by-user'
      ) {
        console.info('Authentication popup closed or cancelled.');
        return;
      }
      console.error('Firebase Auth error:', error);
      throw error;
    }
  };

  const loginWithCredentials = async (username: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      throw new Error('Please enter both username and password.');
    }

    let accountData: any = null;

    // Try reading from Firestore accounts
    try {
      const accountRef = doc(db, 'accounts', cleanUsername);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) {
        accountData = accountSnap.data();
      }
    } catch (err: any) {
      console.warn('Firestore account lookup notice:', err?.message || err);
    }

    // Fall back to local accounts storage if Firestore read was restricted or account not in cloud
    if (!accountData) {
      try {
        const localAccounts = JSON.parse(localStorage.getItem('kuradex_local_accounts') || '{}');
        if (localAccounts[cleanUsername]) {
          accountData = localAccounts[cleanUsername];
        }
      } catch {
        // ignore
      }
    }

    // If account still doesn't exist, treat as invalid credentials
    if (!accountData || !accountData.salt || !accountData.passwordHash) {
      throw new Error('Invalid username or password.');
    }

    try {
      const isValid = await verifyPassword(password, accountData.salt, accountData.passwordHash);
      if (!isValid) {
        throw new Error('Invalid username or password.');
      }
    } catch (err: any) {
      if (err?.message === 'Invalid username or password.') {
        throw err;
      }
      throw new Error('Invalid username or password.');
    }

    // Try reading the associated user doc to get latest displayName/photoURL if updated
    let profileDisplayName = accountData.displayName || accountData.displayUsername || cleanUsername;
    let profilePhotoURL = null;

    try {
      if (accountData.userId) {
        const userRef = doc(db, 'users', accountData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const udata = userSnap.data();
          if (udata.displayName) profileDisplayName = udata.displayName;
          if (udata.photoURL) profilePhotoURL = udata.photoURL;
          if (!udata.email || !udata.username) {
            await setDoc(userRef, {
              email: `${cleanUsername}@kuradex.internal`,
              username: cleanUsername,
            }, { merge: true });
          }
        } else {
          await setDoc(userRef, {
            userId: accountData.userId,
            displayName: profileDisplayName,
            username: cleanUsername,
            email: `${cleanUsername}@kuradex.internal`,
            photoURL: null,
            createdAt: serverTimestamp(),
          }, { merge: true });
        }
      }
    } catch {
      // Non-critical fallback
    }

    // Try authenticating session with Firebase Auth anonymously if supported
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch {
      // Anonymous auth not enabled in console, proceed with local session
    }

    const effectiveUid = auth.currentUser?.uid || accountData.userId || `u_${cleanUsername}`;

    const customUser: AppUser = {
      uid: effectiveUid,
      displayName: profileDisplayName,
      photoURL: profilePhotoURL,
      email: `${cleanUsername}@kuradex.internal`,
      emailVerified: true,
      username: cleanUsername,
      isCustomAuth: true,
    };

    localStorage.setItem('kuradex_custom_auth', JSON.stringify(customUser));
    setUser(customUser);
  };

  const registerWithCredentials = async (
    username: string,
    password: string,
    displayName: string
  ) => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (!cleanUsername) {
      throw new Error('Username is required.');
    }
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(cleanUsername)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (!cleanDisplayName) {
      throw new Error('Display name is required.');
    }

    // Check if username is already taken in Firestore or local
    let isTaken = false;
    try {
      const accountRef = doc(db, 'accounts', cleanUsername);
      const existing = await getDoc(accountRef);
      if (existing.exists()) {
        isTaken = true;
      }
    } catch {
      // Non-blocking if unauthenticated read is restricted by cloud rules
    }

    if (!isTaken) {
      try {
        const localAccounts = JSON.parse(localStorage.getItem('kuradex_local_accounts') || '{}');
        if (localAccounts[cleanUsername]) {
          isTaken = true;
        }
      } catch {
        // ignore
      }
    }

    if (isTaken) {
      throw new Error('Username is already taken. Please choose another.');
    }

    // Encrypt password before saving
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    // Try authenticating session with Firebase Auth anonymously if supported
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch {
      // Anonymous auth not enabled in console, proceed with local session
    }

    const userId = auth.currentUser?.uid || `u_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const accountRecord = {
      username: cleanUsername,
      displayUsername: username.trim(),
      displayName: cleanDisplayName,
      userId,
      email: `${cleanUsername}@kuradex.internal`,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    // Save to local accounts storage
    try {
      const localAccounts = JSON.parse(localStorage.getItem('kuradex_local_accounts') || '{}');
      localAccounts[cleanUsername] = accountRecord;
      localStorage.setItem('kuradex_local_accounts', JSON.stringify(localAccounts));
    } catch (err) {
      console.warn('Failed to save to local accounts cache:', err);
    }

    // Attempt to persist to Firestore
    try {
      const accountRef = doc(db, 'accounts', cleanUsername);
      await setDoc(accountRef, {
        ...accountRecord,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'users', userId), {
        userId,
        displayName: cleanDisplayName,
        username: cleanUsername,
        email: `${cleanUsername}@kuradex.internal`,
        photoURL: null,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      console.warn('Firestore cloud sync notice (account saved locally):', err?.message || err);
    }

    const customUser: AppUser = {
      uid: userId,
      displayName: cleanDisplayName,
      photoURL: null,
      email: `${cleanUsername}@kuradex.internal`,
      emailVerified: true,
      username: cleanUsername,
      isCustomAuth: true,
    };

    localStorage.setItem('kuradex_custom_auth', JSON.stringify(customUser));
    setUser(customUser);
  };

  const logout = async () => {
    localStorage.removeItem('kuradex_custom_auth');
    try {
      await signOut(auth);
    } catch {
      // Ignored
    }
    setUser(null);
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (auth.currentUser) {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    }

    if (user?.uid) {
      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      // Update custom auth storage if applicable
      const stored = localStorage.getItem('kuradex_custom_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updated = { ...parsed, ...data };
          localStorage.setItem('kuradex_custom_auth', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      setUser((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const adminEmail = process.env.ADMIN_EMAIL || '';
  const isAdmin = !!(
    user &&
    (
      (user.email && (
        (adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase()) ||
        user.email.toLowerCase() === 'jkninja238@gmail.com' ||
        user.email.toLowerCase() === 'admin@kuradex.com'
      )) ||
      (user as AppUser).username === 'admin'
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        login,
        loginWithCredentials,
        registerWithCredentials,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
