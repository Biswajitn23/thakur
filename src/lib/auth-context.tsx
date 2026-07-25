import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider, isFirebaseConfigured } from "./firebase";

export type UserRole = "admin" | "customer" | "guest";

// Firestore path: config/adminSettings → { emails: string[] }
const ADMIN_CONFIG_DOC = "config/adminSettings";
const LOCAL_STORAGE_ADMIN_KEY = "thakur_admin_emails_cache";

/** Fetch admin emails from Firestore (with localStorage fallback) */
export async function fetchAdminEmails(): Promise<string[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "config", "adminSettings"));
      if (snap.exists()) {
        const emails: string[] = snap.data()?.emails ?? [];
        // Cache locally for offline / fast checks
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(emails));
        }
        return emails;
      }
    } catch (err) {
      console.warn("Firestore admin fetch failed, using cache:", err);
    }
  }
  // Fallback to cached value
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore */ }
    }
  }
  return [];
}

/** Write admin emails to Firestore (and update local cache) */
export async function setAdminEmails(emails: string[]): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "config", "adminSettings"), { emails }, { merge: true });
  }
  // Always update local cache too
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(emails));
  }
}

/** Sync-safe check using cached list (Firestore list is loaded async on boot) */
export function getCachedAdminEmails(): string[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* ignore */ }
  }
  return [];
}

export function isAdminEmail(email: string | null | undefined, list?: string[]): boolean {
  if (!email) return false;
  const emails = list ?? getCachedAdminEmails();
  return emails.includes(email.toLowerCase().trim());
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
  adminEmails: string[];
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, pass: string, name: string, rememberMe?: boolean) => Promise<void>;
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
  const [adminEmails, setAdminEmailsState] = useState<string[]>(getCachedAdminEmails());
  // Ref so onAuthStateChanged callback always sees latest admin list
  const adminEmailsRef = useRef<string[]>(adminEmails);
  // Track readiness of both async streams before releasing loading
  const adminListReady = useRef(false);
  const authReady = useRef(false);

  const checkBothReady = () => {
    if (adminListReady.current && authReady.current) {
      setLoading(false);
    }
  };

  // ── 1. Subscribe to Firestore admin list in real-time ──────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      // No Firestore — mark admin list ready immediately
      adminListReady.current = true;
      checkBothReady();
      return;
    }
    const unsub = onSnapshot(
      doc(db, "config", "adminSettings"),
      (snap) => {
        const emails: string[] = snap.exists() ? (snap.data()?.emails ?? []) : [];
        adminEmailsRef.current = emails;
        setAdminEmailsState(emails);
        // Keep local cache fresh
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(emails));
        }
        // Re-evaluate current user's role whenever admin list updates
        setUser((prev) => {
          if (!prev) return prev;
          const role: UserRole = isAdminEmail(prev.email, emails) ? "admin" : "customer";
          return role !== prev.role ? { ...prev, role } : prev;
        });
        // Mark admin list as loaded and check if we can release loading
        if (!adminListReady.current) {
          adminListReady.current = true;
          checkBothReady();
        }
      },
      (err) => {
        console.warn("Admin list snapshot error:", err);
        // On error still unblock loading
        adminListReady.current = true;
        checkBothReady();
      }
    );
    return () => unsub();
  }, []);

  // ── 2. Firebase Auth state listener ────────────────────────────────────────
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      // Handle Google/Facebook redirect result
      getRedirectResult(auth)
        .then((cred) => {
          if (cred) {
            const role: UserRole = isAdminEmail(cred.user.email, adminEmailsRef.current)
              ? "admin"
              : "customer";
            setUser({
              uid: cred.user.uid,
              email: cred.user.email,
              displayName: cred.user.displayName,
              photoURL: cred.user.photoURL,
              role,
            });
          }
        })
        .catch((err) => console.error("Redirect sign-in error:", err));

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Always do a fresh Firestore read once we have an authenticated user.
          // This is the safety net: if the initial onSnapshot failed (e.g. rules
          // required auth but fired before login), we re-fetch now.
          let freshEmails = adminEmailsRef.current;
          if (isFirebaseConfigured && db) {
            try {
              const snap = await getDoc(doc(db, "config", "adminSettings"));
              if (snap.exists()) {
                freshEmails = snap.data()?.emails ?? [];
                adminEmailsRef.current = freshEmails;
                setAdminEmailsState(freshEmails);
                if (typeof window !== "undefined") {
                  localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(freshEmails));
                }
              }
            } catch (err) {
              console.warn("Fresh admin fetch failed, using cached list:", err);
            }
          }
          const role: UserRole = isAdminEmail(firebaseUser.email, freshEmails)
            ? "admin"
            : "customer";
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Valued Customer",
            photoURL: firebaseUser.photoURL,
            role,
          });
        } else {
          setUser(null);
        }
        // Mark auth as resolved and check if we can release loading
        authReady.current = true;
        checkBothReady();
      });
      return () => unsubscribe();
    } else {
      // Fallback local-storage demo mode
      const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
      }
      authReady.current = true;
      adminListReady.current = true;
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

  // ── Auth methods ────────────────────────────────────────────────────────────
  const login = async (email: string, pass: string, rememberMe = true) => {
    if (isFirebaseConfigured && auth) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const role: UserRole = isAdminEmail(cred.user.email, adminEmailsRef.current)
        ? "admin"
        : "customer";
      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split("@")[0],
        photoURL: cred.user.photoURL,
        role,
      });
    } else {
      const role: UserRole = isAdminEmail(email, adminEmailsRef.current) ? "admin" : "customer";
      saveDemoUser({
        uid: "demo-user-" + Date.now(),
        email,
        displayName: email.split("@")[0],
        photoURL: null,
        role,
      });
    }
  };

  const signup = async (email: string, pass: string, name: string, rememberMe = true) => {
    if (isFirebaseConfigured && auth) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      const role: UserRole = isAdminEmail(email, adminEmailsRef.current) ? "admin" : "customer";
      setUser({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        photoURL: null,
        role,
      });
    } else {
      const role: UserRole = isAdminEmail(email, adminEmailsRef.current) ? "admin" : "customer";
      saveDemoUser({
        uid: "demo-user-" + Date.now(),
        email,
        displayName: name,
        photoURL: null,
        role,
      });
    }
  };

  const loginWithGoogle = async (rememberMe = true) => {
    if (isFirebaseConfigured && auth) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err: any) {
        console.warn("Google popup blocked, falling back to redirect:", err);
        await signInWithRedirect(auth, googleProvider);
      }
    } else {
      saveDemoUser({ uid: "google-demo-123", email: "demo.user@gmail.com", displayName: "Google Demo User", photoURL: null, role: "customer" });
    }
  };

  const loginWithFacebook = async (rememberMe = true) => {
    if (isFirebaseConfigured && auth) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      try {
        await signInWithPopup(auth, facebookProvider);
      } catch (err: any) {
        console.warn("Facebook popup blocked, falling back to redirect:", err);
        await signInWithRedirect(auth, facebookProvider);
      }
    } else {
      saveDemoUser({ uid: "facebook-demo-123", email: "demo.fb.user@gmail.com", displayName: "Facebook Demo User", photoURL: null, role: "customer" });
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
    if (isFirebaseConfigured && auth) await signOut(auth);
    saveDemoUser(null);
  };

  const toggleDemoAdmin = () => {
    if (!user) {
      saveDemoUser({ uid: "admin-demo-999", email: "admin@thakuryograj.com", displayName: "Thakur Admin", photoURL: null, role: "admin" });
    } else {
      const newRole: UserRole = user.role === "admin" ? "customer" : "admin";
      saveDemoUser({ ...user, role: newRole });
    }
  };

  const userRole = user?.role || "guest";
  const isAdmin = userRole === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, userRole, isAdmin, adminEmails, login, signup, loginWithGoogle, loginWithFacebook, resetPassword, logout, toggleDemoAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
