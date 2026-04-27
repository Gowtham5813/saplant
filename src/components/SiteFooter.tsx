import { Sprout } from "lucide-react";

export const SiteFooter = () => (
  <footer className="border-t border-border/60 bg-surface-cream/50">
    <div className="container py-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-forest">
            <Sprout className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg">Saplant</span>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Restoring the planet, one sapling at a time. © {new Date().getFullYear()}
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-organic">Privacy</a>
          <a href="#" className="hover:text-foreground transition-organic">Terms</a>
          <a href="#" className="hover:text-foreground transition-organic">Contact</a>
        </div>
      </div>
    </div>
  </footer>
);
