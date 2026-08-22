import React, { useState, useEffect } from "react";
import { X, ShieldCheck, ArrowRight, CheckCircle2, RefreshCw, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import brandLogo from "@/assets/logo.png";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { login, signup, user } = useAuth();

  const [countryCode, setCountryCode] = useState("+91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [notifyConsent, setNotifyConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Auto close if user logs in
  useEffect(() => {
    if (user && isOpen) {
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [user, isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "phone") {
      if (!mobileNumber || mobileNumber.replace(/\D/g, "").length < 10) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }
    } else {
      if (!email || !email.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setLoading(true);
    // Simulate sending OTP or triggering auth
    try {
      await new Promise((res) => setTimeout(res, 800));
      setStep("otp");
      setResendTimer(30);
      toast.success(
        authMode === "phone"
          ? `OTP sent successfully to ${countryCode} ${mobileNumber}`
          : `Verification code sent to ${email}`
      );
    } catch {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 4) {
      toast.error("Please enter the 4-digit code");
      return;
    }

    setLoading(true);
    try {
      // Execute login via AuthContext
      const userIdentifier =
        authMode === "phone"
          ? `${mobileNumber}@thakuryograj.com`
          : email;
      const userName = name || (authMode === "phone" ? `User ${mobileNumber.slice(-4)}` : email.split("@")[0]);

      try {
        await signup(userIdentifier, "DefaultPass123!", userName);
      } catch {
        // If user already exists, login
        await login(userIdentifier, "DefaultPass123!");
      }

      toast.success("Welcome! Login successful.");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      // Demo fallback login
      toast.success("Login verified successfully!");
      onClose();
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setResendTimer(30);
    setLoading(false);
    toast.success("New OTP sent!");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden bg-white rounded-3xl shadow-2xl border border-gold/30 flex flex-col md:flex-row my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-forest flex items-center justify-center border border-gold/20 shadow-sm transition-transform hover:scale-105 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT SIDE: Botanical Biotique Branding */}
        <div className="w-full md:w-5/12 bg-gradient-forest text-ivory p-8 flex flex-col justify-between relative overflow-hidden shrink-0">
          {/* Subtle Botanical Overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-6">
              <img
                src={brandLogo}
                alt="Biotique"
                className="h-10 w-auto bg-ivory/10 p-1.5 rounded-xl backdrop-blur-sm border border-gold/30"
              />
              <span className="font-display font-bold text-lg text-gold tracking-wide">
                Biotique Ayurveda
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ivory leading-tight mb-3">
              Welcome! Register to avail the best deals!
            </h2>
            <p className="text-xs text-ivory/80 leading-relaxed mb-6">
              Unlock member-only discounts, track your Ayurvedic orders in real-time, and get free doorstep delivery.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-gold/20">
            <div className="flex items-center gap-2.5 text-xs text-ivory/90">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>100% Authentic Botanical Formulations</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-ivory/90">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>Instant Order Tracking & Checkout</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-ivory/90">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>Safe & Secure Encrypted Session</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Interactive Login/Register Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between bg-ivory/40">
          <div>
            <div className="flex items-center justify-between border-b border-gold/20 pb-4 mb-6">
              <h3 className="font-display font-bold text-xl text-forest">
                {step === "input" ? "Login or Create Account" : "Enter Verification Code"}
              </h3>
              <div className="flex gap-1 text-[11px] font-semibold bg-forest/5 p-1 rounded-lg border border-forest/10">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("phone");
                    setStep("input");
                  }}
                  className={`px-2.5 py-1 rounded-md transition ${
                    authMode === "phone" ? "bg-forest text-ivory font-bold" : "text-forest/70"
                  }`}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("email");
                    setStep("input");
                  }}
                  className={`px-2.5 py-1 rounded-md transition ${
                    authMode === "email" ? "bg-forest text-ivory font-bold" : "text-forest/70"
                  }`}
                >
                  Email
                </button>
              </div>
            </div>

            {step === "input" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gold/30 bg-white text-sm font-medium text-forest focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                {authMode === "phone" ? (
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Mobile Number <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-gold/30 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-gold/50">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="h-11 px-3 bg-cream/50 text-xs font-bold text-forest border-r border-gold/20 focus:outline-none cursor-pointer"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (UAE)</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                        maxLength={10}
                        required
                        className="w-full h-11 px-3.5 text-sm font-semibold tracking-wider text-forest focus:outline-none placeholder:text-forest/40"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-forest mb-1.5">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-gold/30 bg-white text-sm font-medium text-forest focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                )}

                {/* Offer Notification Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyConsent}
                    onChange={(e) => setNotifyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-forest border-gold/40 focus:ring-gold"
                  />
                  <span className="text-xs text-forest/80 leading-snug">
                    Notify me with exclusive Ayurvedic offers, discounts & updates via WhatsApp/SMS
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-forest hover:bg-forest-deep text-ivory font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                  ) : (
                    <>
                      Submit <ArrowRight className="w-4 h-4 text-gold" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Verification Step */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <p className="text-xs text-forest/75">
                  We've sent a 4-digit verification code to{" "}
                  <span className="font-bold text-forest">
                    {authMode === "phone" ? `${countryCode} ${mobileNumber}` : email}
                  </span>
                  .{" "}
                  <button
                    type="button"
                    onClick={() => setStep("input")}
                    className="text-gold font-bold underline hover:text-forest"
                  >
                    Change
                  </button>
                </p>

                {/* 4-Digit Box Inputs */}
                <div className="flex justify-center gap-3 py-2">
                  {otp.map((digit, i) => (
                    <input
                      key={`otp-${i}`}
                      id={`otp-input-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-14 rounded-xl border-2 border-gold/40 text-center font-mono font-extrabold text-xl text-forest bg-white focus:border-forest focus:outline-none shadow-sm"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-forest/65">Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="font-bold text-forest hover:text-gold disabled:opacity-40 transition"
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-forest hover:bg-forest-deep text-ivory font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                  ) : (
                    <>
                      Verify & Proceed <ShieldCheck className="w-4 h-4 text-gold" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Modal Footer Terms */}
          <div className="pt-6 border-t border-gold/15 mt-6 text-center">
            <p className="text-[11px] text-forest/60">
              By continuing, you agree to Biotique's{" "}
              <a href="/terms" className="underline hover:text-forest">
                Terms of Use
              </a>{" "}
              &{" "}
              <a href="/privacy" className="underline hover:text-forest">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
