import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { RotateCcw, MailCheck, LogOut, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

export default function VerifyEmail() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuth()

  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect if not logged in or already verified
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true })
    } else if (user.isEmailVerified) {
      navigate("/user/conversations", { replace: true })
    }
  }, [user, navigate])

  // Auto-send OTP on mount
  useEffect(() => {
    if (user && !user.isEmailVerified) {
      handleSendOtp(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown ticker
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current!)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }
    return () => clearInterval(countdownRef.current!)
  }, [countdown])

  const handleSendOtp = async (silent = false) => {
    setSending(true)
    try {
      await authApi.sendVerificationOtp()
      setOtpSent(true)
      setCountdown(60)
      if (!silent) toast.success("Verification OTP sent! Check your inbox.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send OTP. Try again."
      )
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP.")
      return
    }
    setLoading(true)
    try {
      await authApi.verifyEmail(otpCode)
      // Update local user state so the rest of the app knows the email is verified
      if (user) setUser({ ...user, isEmailVerified: true })
      toast.success("Email verified successfully! Welcome to ChatLoop.")
      navigate("/user/conversations", { replace: true })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Invalid OTP. Try again."
      )
      setOtpCode("")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setOtpCode("")
    await handleSendOtp()
  }

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  // Mask email for display: show first 2 chars + *** + @domain
  const maskedEmail = user?.email
    ? (() => {
        const [name, domain] = user.email.split("@")
        return `${name.slice(0, 2)}***@${domain}`
      })()
    : ""

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      {/* ── Left decorative panel ─────────────────────────────── */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-primary lg:flex lg:w-[45%] dark:bg-primary/80">
        {/* abstract blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
        <div className="absolute top-1/2 -right-16 h-56 w-56 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 max-w-sm space-y-6 px-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-xl backdrop-blur-sm">
            <MessageCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">ChatLoop</h1>
            <p className="text-lg leading-relaxed text-white/70">
              One last step — verify your email to get started.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-background p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Verify your email
              </h2>
              <p className="text-sm text-muted-foreground">
                {otpSent ? (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-foreground">
                      {maskedEmail}
                    </span>
                  </>
                ) : (
                  "Sending verification code to your email…"
                )}
              </p>
            </div>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={loading || sending || !otpSent}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {!otpSent && sending && (
                <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" /> Sending code…
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary/90 text-white hover:bg-primary"
              disabled={loading || otpCode.length !== 6 || !otpSent}
            >
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {loading ? "Verifying…" : "Verify Email"}
            </Button>

            {/* Resend */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || sending || loading}
                className="flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>
          </form>

          {/* Logout */}
          <div className="border-t pt-2">
            <p className="mb-3 text-center text-sm text-muted-foreground">
              Wrong account?
            </p>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
