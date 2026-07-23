import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider, isFirebaseConfigured } from "./firebase";

export type UserRole = "admin" | "customer" | "guest";

const DEFAULT_ADMIN_EMAILS = [
  "nbiswajit978@gmail.com",
];

const ADMIN_LIST_KEY = "thakur_admin_emails";

export function getAdminEmails(): string[] {
  if (typeof window === "undefined") return DEFAULT_ADMIN_EMAILS;
  const saved = localStorage.getItem(ADMIN_LIST_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  return DEFAULT_ADMIN_EMAILS;
}

export function setAdminEmails(emails: string[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_LIST_KEY, JSON.stringify(emails));
  }
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase().trim());
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  userRole: UserRole;
  isAdmin: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  loginWithFacebook: (rememberMe?: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "thakur_demo_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      // Capture credentials from redirect
      getRedirectResult(auth)
        .then((cred) => {
          if (cred) {
            const isAdminUser = isAdminEmail(cred.user.email);
            setUser({
              uid: cred.user.uid,
              email: cred.user.email,
              displayName: cred.user.displayName,
              photoURL: cred.user.photoURL,
              role: isAdminUser ? "admin" : "customer",
            });
          }
        })
        .catch((err) => {
          console.error("Redirect sign-in error:", err);
        });

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const isAdminUser = isAdminEmail(firebaseUser.email);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Valued Customer",
            photoURL: firebaseUser.photoURL,
            role: isAdminUser ? "admin" : "customer",
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Fallback local storage mode for testing when Firebase env is not configured
      const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const saveDemoUser = (newUser: AppUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  const login = async (email: string, pass: string, rememberMe: boolean = false) => {
    if (isFirebaseConfigured && auth) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const isAdminUser = isAdminEmail(cred.user.email);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split("@")[0],
        photoURL: cred.user.photoURL,
        role: isAdminUser ? "admin" : "customer",
      });
    } else {
      // Demo login
      const isAdminUser = isAdminEmail(email);
      saveDemoUser({
        uid: "demo-user-" + Date.now(),
        email,
        displayName: email.split("@")[0],
        photoURL: null,
        role: isAdminUser ? "admin" : "customer",
      });
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      const isAdminUser = isAdminEmail(email);
      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        photoURL: null,
        role: isAdminUser ? "admin" : "customer",
      });
    } else {
      // Demo signup
      const isAdminUser = isAdminEmail(email);
      saveDemoUser({
        uid: "demo-user-" + Date.now(),
        email,
        displayName: name,
        photoURL: null,
        role: isAdminUser ? "admin" : "customer",
      });
    }
  };

  const loginWithGoogle = async (rememberMe: boolean = false) => {
    if (isFirebaseConfigured && auth) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err: any) {
        console.warn("Google popup blocked or COOP error, falling back to redirect:", err);
        await signInWithRedirect(auth, googleProvider);
      }
    } else {
      saveDemoUser({
        uid: "google-demo-123",
        email: "demo.user@gmail.com",
        displayName: "Google Demo User",
        photoURL: null,
        role: "customer",
      });
    }
  };

  const loginWithFacebook = async (rememberMe: boolean = false) => {
    if (isFirebaseConfigured && auth) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      try {
        await signInWithPopup(auth, facebookProvider);
      } catch (err: any) {
        console.warn("Facebook popup blocked or COOP error, falling back to redirect:", err);
        await signInWithRedirect(auth, facebookProvider);
      }
    } else {
      saveDemoUser({
        uid: "facebook-demo-123",
        email: "demo.fb.user@gmail.com",
        displayName: "Facebook Demo User",
        photoURL: null,
        role: "customer",
      });
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`Demo Mode: Password reset email sent to ${email}`);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    saveDemoUser(null);
  };

  const toggleDemoAdmin = () => {
    if (!user) {
      saveDemoUser({
        uid: "admin-demo-999",
        email: "admin@thakuryograj.com",
        displayName: "Thakur Admin",
        photoURL: null,
        role: "admin",
      });
    } else {
      const newRole: UserRole = user.role === "admin" ? "customer" : "admin";
      saveDemoUser({ ...user, role: newRole });
    }
  };

  const userRole = user?.role || "guest";
  const isAdmin = userRole === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userRole,
        isAdmin,
        login,
        signup,
        loginWithGoogle,
        loginWithFacebook,
        resetPassword,
        logout,
        toggleDemoAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
