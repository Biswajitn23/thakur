import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, ArrowRight, CheckCircle2, ShoppingBag, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import ingredientsImg from "@/assets/ingredients.jpg";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message || "";
    // Check for Firebase Auth Error Codes / Technical Patterns
    if (message.includes("auth/invalid-credential") || message.includes("INVALID_LOGIN_CREDENTIALS")) {
      return "Incorrect email or password. Please verify your entries.";
    }
    if (message.includes("auth/user-not-found") || message.includes("EMAIL_NOT_FOUND")) {
      return "No account exists with this email address.";
    }
    if (message.includes("auth/wrong-password") || message.includes("INVALID_PASSWORD")) {
      return "Incorrect password. Please try again.";
    }
    if (message.includes("auth/email-already-in-use") || message.includes("EMAIL_EXISTS")) {
      return "An account with this email address already exists.";
    }
    if (message.includes("auth/weak-password") || message.includes("WEAK_PASSWORD")) {
      return "Your password is too weak. Please use at least 6 characters.";
    }
    if (message.includes("auth/invalid-email") || message.includes("INVALID_EMAIL")) {
      return "Please enter a valid email address.";
    }
    if (message.includes("auth/popup-closed-by-user")) {
      return "Sign-in was cancelled.";
    }
    return message;
  }
  return "An unexpected error occurred. Please try again.";
}

function LoginPage() {
  const { login, signup, loginWithGoogle, loginWithFacebook, resetPassword, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleBack = () => {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      window.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate({ to: "/admin" });
      } else {
        // Return to previous page or main page
        handleBack();
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, name, rememberMe);
        toast.success("Account registered successfully! Welcome to the tribe.");
      } else {
        await login(email, password, rememberMe);
        toast.success("Welcome back to your sanctuary.");
      }
      
      // Navigation handled by the useEffect above when user state updates
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle(rememberMe);
      toast.success("Signed in successfully via Google.");
      // Navigation handled by useEffect based on user role
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };
  const handleFacebook = async () => {
    try {
      await loginWithFacebook(rememberMe);
      toast.success("Signed in successfully via Facebook.");
      // Navigation handled by useEffect based on user role
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your Email Address first to request a password reset.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success("A password reset email has been sent! Please check your inbox.");
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#faf8f5] text-stone-900 grid grid-cols-1 md:grid-cols-2 font-sans antialiased">
      {/* Left Column: Traditional Image & Title */}
      <div className="bg-[#f2ebe1] flex flex-col items-center justify-center p-8 md:p-16 border-r border-[#ebdcc9] h-full overflow-y-auto scrollbar-none">
        <div className="max-w-md text-center space-y-8 py-8">
          {/* Arched image */}
          <div 
            className="relative aspect-[3/4] max-w-sm mx-auto overflow-hidden shadow-2xl border border-stone-200"
            style={{ borderRadius: "160px 160px 24px 24px" }}
          >
            <img 
              src={ingredientsImg} 
              alt="Ayurvedic Herbs" 
              className="w-full h-full object-cover grayscale-[15%] contrast-[105%]"
            />
          </div>
          
          <div className="space-y-3">
            <h2 className="font-serif text-5xl md:text-6xl font-bold italic tracking-wide text-[#082a1c]">
              Enter the Ritual.
            </h2>
            <p className="font-serif text-base italic text-amber-900/80">
              Rooted in Chhattisgarh, crafted for the discerning soul.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Ritual Form */}
      <div className="bg-[#faf8f5] flex flex-col items-center justify-center p-8 md:p-16 h-full overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Top Header with Back Button */}
          <div className="flex items-center justify-start border-b border-amber-900/10 pb-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-900/20 hover:border-amber-900/40 text-[#082a1c] hover:text-amber-900 text-xs font-semibold uppercase tracking-wider transition bg-white/80 hover:bg-white shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-800" />
              <span>Back</span>
            </button>
          </div>
          
          {/* Active Session Notification */}
          {user && (
            <div className="p-4 rounded-xl bg-emerald-950/5 border border-emerald-900/20 text-emerald-950 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Logged in as <strong>{user.email || user.displayName}</strong></span>
              </div>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-1 bg-[#082a1c] text-[#cfa860] font-bold rounded-lg hover:bg-stone-900 transition text-[10px] uppercase tracking-wider"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          )}

          {/* Main Form container */}
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h3 className="font-serif text-3xl md:text-4xl text-[#082a1c] tracking-wide font-medium">
                {isSignUp ? "Join the Tribe" : "Your Sanctuary Awaits"}
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                {isSignUp 
                  ? "Register your details below to create a direct wellness account."
                  : "Return to your journey of restorative luxury and ancient healing."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-[0.25em] font-bold text-stone-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Thakur Dev"
                    className="w-full bg-transparent border-b border-amber-900/20 py-2.5 text-sm text-[#082a1c] placeholder:text-stone-300 focus:outline-none focus:border-amber-900/60 transition"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[9px] uppercase tracking-[0.25em] font-bold text-stone-500">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sanctuary.com"
                  className="w-full bg-transparent border-b border-amber-900/20 py-2.5 text-sm text-[#082a1c] placeholder:text-stone-300 focus:outline-none focus:border-amber-900/60 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] uppercase tracking-[0.25em] font-bold text-stone-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-b border-amber-900/20 py-2.5 pr-10 text-sm text-[#082a1c] placeholder:text-stone-300 focus:outline-none focus:border-amber-900/60 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-800 transition cursor-pointer p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#ebdcc9] text-[#082a1c] focus:ring-[#082a1c] w-3.5 h-3.5 cursor-pointer" 
                  />
                  <span className="text-stone-700 font-medium">Keep me signed in</span>
                </label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-amber-800 hover:text-amber-900 font-medium cursor-pointer"
                  >
                    Forgotten Password?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#082a1c] hover:bg-[#041710] text-[#cfa860] font-bold text-xs uppercase tracking-[0.25em] rounded-full transition shadow-lg shadow-[#082a1c]/10 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    {isSignUp ? "Register Account" : "Begin Ritual"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Gold divider lines with dot */}
            <div className="py-4 flex items-center justify-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#cfa860]/40 to-transparent" />
              <span className="text-[#cfa860] text-xs">✦</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#cfa860]/40 to-transparent" />
            </div>

            {/* Social Login buttons */}
            <div className="grid grid-cols-2 gap-4">
              {/* Google Sign In */}
              <button
                onClick={handleGoogle}
                className="py-3 border border-stone-200 hover:border-amber-900/25 rounded-full text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </button>

              {/* Facebook Sign In */}
              <button
                onClick={handleFacebook}
                className="py-3 border border-stone-200 hover:border-amber-900/25 rounded-full text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            <div className="text-center pt-4 text-xs text-stone-500">
              <span>{isSignUp ? "Already a member? " : "New to Thakur Yograj? "}</span>
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-amber-800 hover:text-amber-900 font-semibold underline underline-offset-4 cursor-pointer"
              >
                {isSignUp ? "Sign In" : "Register Now"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
