import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name required").max(60);

// In the Capacitor native app, window.location.origin is capacitor://localhost
// (iOS) or http://localhost (Android) — neither is a valid OAuth callback.
// Always send OAuth back to the published web origin, which IS registered.
const PUBLISHED_ORIGIN = "https://saplant.lovable.app";
const isNativeApp = () => {
  if (typeof window === "undefined") return false;
  const proto = window.location.protocol;
  const host = window.location.hostname;
  return (
    proto === "capacitor:" ||
    proto === "file:" ||
    (proto === "http:" && (host === "localhost" || host === "10.0.2.2"))
  );
};
const getAuthRedirectOrigin = () =>
  isNativeApp() ? PUBLISHED_ORIGIN : window.location.origin;


const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(signInEmail);
      passwordSchema.parse(signInPassword);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back 🌱");
    navigate("/app");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(signUpName);
      emailSchema.parse(signUpEmail);
      passwordSchema.parse(signUpPassword);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        emailRedirectTo: getAuthRedirectOrigin(),

        data: { display_name: signUpName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Welcome to the canopy 🌳");
    navigate("/app");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: getAuthRedirectOrigin(),
    });
    if (result.error) {
      setLoading(false);
      return toast.error("Google sign-in failed");
    }
    if (result.redirected) return;
    // Session set by helper; navigate to app (AuthContext will also redirect)
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: visual */}
      <div className="relative hidden lg:flex bg-gradient-forest grain p-12 flex-col justify-between">
        <Link to="/" className="relative inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-organic w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="relative">
          <Sprout className="h-12 w-12 text-secondary animate-leaf-sway" />
          <h2 className="mt-6 font-serif text-5xl text-primary-foreground leading-tight text-balance">
            Every sapling counts.<br />
            <span className="italic text-secondary">Yours starts today.</span>
          </h2>
          <p className="mt-6 text-primary-foreground/70 max-w-md">
            Join 3,200+ planters logging real trees and growing real forests.
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/50 uppercase tracking-widest">
          Saplant · est. 2026
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-organic mb-8">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mb-8">
            <h1 className="font-serif text-3xl">Welcome to the canopy</h1>
            <p className="mt-2 text-muted-foreground">Sign in or create your free planter account.</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" autoComplete="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="si-pw">Password</Label>
                  <Input id="si-pw" type="password" autoComplete="current-password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
                </div>
                <Button type="submit" variant="forest" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Display name</Label>
                  <Input id="su-name" type="text" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" autoComplete="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="su-pw">Password</Label>
                  <Input id="su-pw" type="password" autoComplete="new-password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required />
                  <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <Button type="submit" variant="forest" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Planting your account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
