import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sprout, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onApp = location.pathname.startsWith("/app");

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-forest shadow-soft transition-organic group-hover:shadow-glow">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">
            Sap<span className="text-primary-glow">lant</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {!onApp && (
            <>
              <a href="#how" className="text-muted-foreground hover:text-foreground transition-organic">How it works</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-organic">Features</a>
              <a href="#community" className="text-muted-foreground hover:text-foreground transition-organic">Community</a>
            </>
          )}
          {onApp && user && (
            <>
              <Link to="/app" className="text-muted-foreground hover:text-foreground transition-organic">Dashboard</Link>
              <Link to="/app/log" className="text-muted-foreground hover:text-foreground transition-organic">Log a planting</Link>
              <Link to="/app/posts" className="text-muted-foreground hover:text-foreground transition-organic">Posts</Link>
              <Link to="/app/community" className="text-muted-foreground hover:text-foreground transition-organic">Community</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {!onApp && (
                <Button asChild variant="forest" size="sm">
                  <Link to="/app">Open app</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="forest" size="sm">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
