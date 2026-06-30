import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sprout, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onApp = location.pathname.startsWith("/app");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const marketingLinks = [
    { href: "#how", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#community", label: "Community" },
  ];
  const appLinks = [
    { to: "/app", label: "Dashboard" },
    { to: "/app/log", label: "Log a planting" },
    { to: "/app/posts", label: "Posts" },
    { to: "/app/community", label: "Community" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-forest shadow-soft transition-organic group-hover:shadow-glow shrink-0">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight truncate">
            Sap<span className="text-primary-glow">lant</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
          {!onApp && marketingLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground transition-organic">{l.label}</a>
          ))}
          {onApp && user && appLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground transition-organic">{l.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {!onApp && (
                <Button asChild variant="forest" size="sm" className="hidden sm:inline-flex">
                  <Link to="/app">Open app</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out" className="hidden md:inline-flex">
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

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-sm">
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl text-left">
                  Sap<span className="text-primary-glow">lant</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {!onApp && marketingLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted transition-organic"
                  >
                    {l.label}
                  </a>
                ))}
                {user && appLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted transition-organic"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6">
                {user ? (
                  <>
                    {!onApp && (
                      <Button asChild variant="forest" onClick={() => setMobileOpen(false)}>
                        <Link to="/app">Open app</Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => { setMobileOpen(false); handleSignOut(); }}>
                      <LogOut className="h-4 w-4" /> Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                      <Link to="/auth">Sign in</Link>
                    </Button>
                    <Button asChild variant="forest" onClick={() => setMobileOpen(false)}>
                      <Link to="/auth">Get started</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
