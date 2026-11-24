import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  isValidNativeOAuthState,
  NATIVE_OAUTH_PENDING_STATE_KEY,
  parseNativeOAuthCallback,
  parsePendingNativeOAuthState,
} from "@/lib/native-oauth";
import { toast } from "sonner";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener BEFORE getSession (per Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    let listener: { remove: () => Promise<void> } | undefined;

    const handleNativeOAuthUrl = async (url: string) => {
      const callback = parseNativeOAuthCallback(url);
      if (!callback) return;

      const pendingStateValue = localStorage.getItem(NATIVE_OAUTH_PENDING_STATE_KEY);
      if (!pendingStateValue) return;
      localStorage.removeItem(NATIVE_OAUTH_PENDING_STATE_KEY);

      const pendingState = parsePendingNativeOAuthState(pendingStateValue);
      if (
        !pendingState ||
        !isValidNativeOAuthState(pendingState.state, callback.state, pendingState.createdAt)
      ) {
        toast.error("Google sign-in could not be verified. Please try again.");
        return;
      }

      await Browser.close().catch(() => undefined);

      if (callback.error) {
        toast.error("Google sign-in was cancelled or denied.");
        return;
      }
      if (!callback.accessToken || !callback.refreshToken) {
        toast.error("Google sign-in did not return a session. Please try again.");
        return;
      }

      try {
        const { error } = await supabase.auth.setSession({
          access_token: callback.accessToken,
          refresh_token: callback.refreshToken,
        });
        if (error) {
          toast.error("Saplant could not finish Google sign-in. Please try again.");
          return;
        }
      } catch {
        toast.error("Saplant could not finish Google sign-in. Please try again.");
        return;
      }

      navigate("/app", { replace: true });
    };

    const registerNativeCallback = async () => {
      listener = await CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        void handleNativeOAuthUrl(url);
      });
      const launchUrl = await CapacitorApp.getLaunchUrl();
      if (launchUrl?.url) await handleNativeOAuthUrl(launchUrl.url);
    };

    void registerNativeCallback().catch(() => {
      toast.error("Google sign-in return support is unavailable. Please update the app.");
    });

    return () => {
      void listener?.remove();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
