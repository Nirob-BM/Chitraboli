import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Mode = "login" | "signup" | "forgot";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email")
  .max(255);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name is too long");

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && event !== "PASSWORD_RECOVERY") {
        checkRoleAndRedirect(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) checkRoleAndRedirect(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRoleAndRedirect = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (data) {
      navigate("/localhost-69");
    } else {
      navigate("/profile");
    }
  };

  const parseAuthError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("user already registered")) return "This email is already registered. Please sign in instead.";
    if (m.includes("invalid login")) return "Invalid email or password.";
    if (m.includes("email not confirmed")) return "Please verify your email before signing in.";
    if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please try again in a few minutes.";
    if (m.includes("pwned") || m.includes("compromised")) return "This password appeared in a data breach. Please choose a stronger one.";
    if (m.includes("weak password")) return "Password is too weak. Use a stronger combination.";
    return message;
  };

  const handleLogin = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) return toast.error(emailResult.error.issues[0].message);
    if (!password) return toast.error("Password is required");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailResult.data,
        password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(parseAuthError(error.message ?? "Sign in failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) return toast.error(nameResult.error.issues[0].message);
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) return toast.error(emailResult.error.issues[0].message);
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) return toast.error(passwordResult.error.issues[0].message);

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: emailResult.data,
        password: passwordResult.data,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name: nameResult.data, full_name: nameResult.data },
        },
      });
      if (error) throw error;
      toast.success("Account created! Check your email to verify your account.");
      setMode("login");
    } catch (error: any) {
      toast.error(parseAuthError(error.message ?? "Sign up failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) return toast.error(emailResult.error.issues[0].message);

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailResult.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Please check your email.");
      setMode("login");
    } catch (error: any) {
      toast.error(parseAuthError(error.message ?? "Could not send reset email"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      // If redirected: browser will navigate away. If not, session was set.
    } catch (error: any) {
      toast.error(error?.message || "Failed to sign in with Google");
    } finally {
      setOauthLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") return handleLogin();
    if (mode === "signup") return handleSignup();
    if (mode === "forgot") return handleForgotPassword();
  };

  const title =
    mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password";
  const subtitle =
    mode === "login"
      ? "Sign in to your account"
      : mode === "signup"
      ? "Create an account to get started"
      : "We'll email you a secure reset link";

  return (
    <Layout>
      <SEO title="Sign In or Create Account" description="Sign in to your Chitraboli account or create one to track orders, save favourites and check out faster." url="/auth" />
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary self-start mb-2"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            )}
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {mode !== "forgot" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={oauthLoading || loading}
                >
                  {oauthLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    or
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={mode === "signup" ? 8 : 6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "signup" && (
                    <p className="text-[11px] text-muted-foreground">
                      At least 8 characters with upper & lowercase letters and a number.
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || oauthLoading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : mode === "login" ? (
                  "Sign In"
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            {mode !== "forgot" && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {mode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Auth;
