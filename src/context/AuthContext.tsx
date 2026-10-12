import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { DatabaseService } from '../services/db';
import { Profile, UserRole } from '../types';

export interface AuthContextType {
  user: { id: string; email: string; displayName?: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  authError: string | null;
  currentPath: string;
  navigate: (path: string) => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectPath?: string }>;
  loginWithGoogle: (targetRole?: UserRole) => Promise<{ success: boolean; error?: string; redirectPath?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES: UserRole[] = ['admin', 'incharge', 'student'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string; displayName?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path && path !== '/' ? path : '/login';
    }
    return '/login';
  });

  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    }
    setCurrentPath(path);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path && path !== '/' ? path : '/login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getRoleDashboard = (userRole: UserRole): string => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'incharge':
        return '/incharge/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  };

  // Profile verification & role extraction from Cloud Firestore
  const verifyAndSetProfile = useCallback(async (userId: string, email: string): Promise<Profile | null> => {
    try {
      const userProfile = await DatabaseService.getProfile(userId, email);
      if (!userProfile) {
        setAuthError(`Profile verification failed: No matching profile found in Firestore for ${email}. Access denied.`);
        return null;
      }

      if (!VALID_ROLES.includes(userProfile.role)) {
        setAuthError(`Invalid role '${userProfile.role}' detected in database profiles collection. Only 'admin', 'incharge', or 'student' roles are granted dashboard access.`);
        return null;
      }

      setProfile(userProfile);
      setRole(userProfile.role);
      setAuthError(null);
      return userProfile;
    } catch (err) {
      console.error('Error fetching profile from Firestore:', err);
      setAuthError('An unexpected error occurred while verifying your examination profile in Firestore.');
      throw err;
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!isMounted) return;

      try {
        if (fbUser) {
          const email = fbUser.email || '';
          setUser({
            id: fbUser.uid,
            email,
            displayName: fbUser.displayName || undefined,
          });

          let verifiedProfile = await verifyAndSetProfile(fbUser.uid, email);
          if (!verifiedProfile && email) {
            // Auto-provision profile in Firestore for authenticated Google user
            const defaultRole: UserRole = email.includes('admin') || email === 'rushilsrisai5@gmail.com' ? 'admin' :
              email.includes('incharge') ? 'incharge' : 'student';
            const newProfile: Profile = {
              id: fbUser.uid,
              email: email.toLowerCase().trim(),
              full_name: fbUser.displayName || email.split('@')[0],
              role: defaultRole,
              reg_no: defaultRole === 'student' ? `2026-ST-${Math.floor(100 + Math.random() * 900)}` : undefined,
              department: defaultRole === 'admin' ? 'Controller of Examinations' : 'Computer Science & Engineering',
              created_at: new Date().toISOString(),
            };
            await DatabaseService.saveProfile(newProfile);
            setProfile(newProfile);
            setRole(newProfile.role);
            verifiedProfile = newProfile;
          }

          if (verifiedProfile) {
            const expectedPath = getRoleDashboard(verifiedProfile.role);
            const path = window.location.pathname;
            if (path === '/' || path === '/login') {
              navigate(expectedPath);
            }
          } else {
            await firebaseSignOut(auth);
            setUser(null);
            setProfile(null);
            setRole(null);
            navigate('/login');
          }
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
          const path = window.location.pathname;
          if (path !== '/login') navigate('/login');
        }
      } catch (err) {
        console.error('Failed to establish Firebase user profile:', err);
        setAuthError(err instanceof Error ? err.message : 'Unable to verify your Firebase profile.');
        try {
          await firebaseSignOut(auth);
        } catch (signOutError) {
          console.error('Failed to clear invalid Firebase session:', signOutError);
        }
        setUser(null);
        setProfile(null);
        setRole(null);
        navigate('/login');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate, verifyAndSetProfile]);

  // Protected route enforcement
  useEffect(() => {
    if (isLoading) return;

    // 1. Unauthenticated users accessing any dashboard must be redirected to /login
    if (!user || !profile || !role) {
      if (currentPath !== '/login') {
        navigate('/login');
      }
      return;
    }

    // 2. Authenticated user accessing /login must be redirected to their role dashboard
    if (currentPath === '/login' || currentPath === '/') {
      navigate(getRoleDashboard(role));
      return;
    }

    // 3. Authenticated users must not access dashboards belonging to other roles
    if (currentPath === '/admin/dashboard' && role !== 'admin') {
      navigate(getRoleDashboard(role));
      return;
    }
    if (currentPath === '/incharge/dashboard' && role !== 'incharge') {
      navigate(getRoleDashboard(role));
      return;
    }
    if (currentPath === '/student/dashboard' && role !== 'student') {
      navigate(getRoleDashboard(role));
      return;
    }
  }, [currentPath, user, profile, role, isLoading, navigate]);

  // Firebase Email/Password Sign-In
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string; redirectPath?: string }> => {
    setAuthError(null);
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Validate fields
    if (!trimmedEmail) {
      const err = 'Please enter your university email address.';
      setAuthError(err);
      return { success: false, error: err };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      const err = 'Please enter a valid email address format.';
      setAuthError(err);
      return { success: false, error: err };
    }
    if (!password) {
      const err = 'Please enter your account password.';
      setAuthError(err);
      return { success: false, error: err };
    }

    // Try Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const verifiedProfile = await verifyAndSetProfile(cred.user.uid, cred.user.email || trimmedEmail);
      if (!verifiedProfile) {
        await firebaseSignOut(auth);
        const errMsg = 'Profile record not found in Cloud Firestore. Contact Examination Administration.';
        setAuthError(errMsg);
        return { success: false, error: errMsg };
      }
      const targetPath = getRoleDashboard(verifiedProfile.role);
      navigate(targetPath);
      return { success: true, redirectPath: targetPath };
    } catch (fbErr: any) {
      console.warn('Firebase signInWithEmailAndPassword failed:', fbErr.code);
      const errMsg = fbErr.message?.includes('invalid-credential') || fbErr.code === 'auth/invalid-credential'
        ? 'Invalid login credentials. Please check your university email and password.'
        : fbErr.message || 'Authentication failed.';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Firebase Google Sign-In with Role Allocation (Admin, Incharge, Student) & Firestore Persistence
  const loginWithGoogle = async (
    targetRole?: UserRole
  ): Promise<{ success: boolean; error?: string; redirectPath?: string }> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user.email || '').toLowerCase().trim();
      const roleDetermined: UserRole = targetRole || (
        email.includes('admin') || email === 'rushilsrisai5@gmail.com' ? 'admin' :
        email.includes('incharge') ? 'incharge' : 'student'
      );

      // Verify or update profile in Cloud Firestore
      let userProfile = await DatabaseService.getProfile(result.user.uid, email);

      if (!userProfile || (targetRole && userProfile.role !== targetRole)) {
        const newProfile: Profile = {
          id: result.user.uid,
          email,
          full_name: result.user.displayName || email.split('@')[0],
          role: roleDetermined,
          reg_no: roleDetermined === 'student' ? `2026-ST-${Math.floor(100 + Math.random() * 900)}` : undefined,
          department: roleDetermined === 'admin' ? 'Controller of Examinations' : 'Computer Science & Engineering',
          created_at: userProfile?.created_at || new Date().toISOString(),
        };
        await DatabaseService.saveProfile(newProfile);
        userProfile = newProfile;
      }

      setProfile(userProfile);
      setRole(userProfile.role);
      const loggedUser = {
        id: userProfile.id,
        email: userProfile.email,
        displayName: userProfile.full_name,
      };
      setUser(loggedUser);

      await DatabaseService.addAuditLog({
        action: 'USER_SIGNED_IN',
        entity_type: 'system',
        performed_by: userProfile.email,
        performed_by_name: userProfile.full_name,
        details: `Firebase Google authentication completed for ${userProfile.role.toUpperCase()} portal.`,
      }).catch(console.warn);

      const targetPath = getRoleDashboard(userProfile.role);
      navigate(targetPath);
      return { success: true, redirectPath: targetPath };
    } catch (err: any) {
      console.warn('Google Sign-In caught:', err.code, err.message);

      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('auth/unauthorized-domain')) {
        const errMsg = 'auth/unauthorized-domain';
        setAuthError(errMsg);
        return { success: false, error: errMsg };
      }

      if (err.code === 'auth/popup-closed-by-user') {
        const errMsg = 'Google Sign-In window was closed. Please try again.';
        setAuthError(errMsg);
        return { success: false, error: errMsg };
      }

      const errMsg = err.message || 'Google Sign-In could not be completed.';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out note:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setRole(null);
      setAuthError(null);
      navigate('/login');
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        authError,
        currentPath,
        navigate,
        loginWithEmail,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
