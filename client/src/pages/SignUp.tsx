import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  ArrowLeft,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

export default function SignUp() {
  const navigate = useNavigate()
  const { register, user } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/user/conversations", { replace: true })
  }, [user, navigate])

  const validate = () => {
    if (!name.trim()) return "Please enter your name."
    if (!email.trim()) return "Please enter your email address."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address."
    if (password.length < 6) return "Password must be at least 6 characters."
    if (password !== confirmPassword) return "Passwords do not match."
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }
    setLoading(true)
    try {
      await register(name.trim(), email.trim().toLowerCase(), password)
      navigate("/user/conversations", { replace: true })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Registration failed. Try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    if (!password) return null
    if (password.length < 6)
      return { level: 1, label: "Weak", color: "bg-destructive" }
    if (
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    )
      return { level: 2, label: "Fair", color: "bg-amber-400" }
    return { level: 3, label: "Strong", color: "bg-green-500" }
  }
  const strength = passwordStrength()

  return (
    <div className="relative h-full overflow-hidden bg-background">
      {/* ── Spotlight cards – visible on large screens only ─────── */}
      {/* {spotlights.map((s) => {
        const Icon = s.icon
        return (
          <div
            key={s.title}
            className="pointer-events-none absolute hidden w-56 flex-col gap-2 rounded-2xl border border-border/50 bg-card/60 p-4 shadow-lg shadow-black/5 backdrop-blur-sm xl:flex dark:shadow-black/20"
            style={{
              [s.side]: "calc(50% - 340px - 240px)",
              top: s.top,
              transform: "translateX(0)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <p className="text-sm font-semibold">{s.title}</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {s.desc}
            </p>
          </div>
        )
      })} */}

      {/* ── Scrollable center column ────────────────────────────── */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-10">
        <div className="flex w-full max-w-100 flex-col gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-sm">
              <MessageCircle
                className="h-7 w-7 text-primary"
                strokeWidth={1.8}
              />
            </div>
            <div>
              <h1 className="text-[2.25rem] leading-none font-bold tracking-tight text-foreground">
                ChatLoop
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Chat with anyone, anywhere, instantly.
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xl shadow-black/5 dark:shadow-black/25">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-tight">
                Create an account
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Fill in the details below to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Strength bar */}
                {strength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength:{" "}
                      <span className="font-medium text-foreground">
                        {strength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className={`pr-10 ${
                      confirmPassword && confirmPassword !== password
                        ? "border-destructive focus-visible:ring-destructive/20"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-destructive">
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary/90 hover:bg-primary"
                disabled={loading}
              >
                {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </div>

          {/* Footer links */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-primary transition-opacity hover:opacity-80"
              >
                Sign in
              </Link>
            </p>
            <Link to="/">
              <Button
                variant="link"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
