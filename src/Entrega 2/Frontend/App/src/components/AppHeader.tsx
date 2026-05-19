import { Link, useNavigate } from "@tanstack/react-router";
import { Snowflake, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
      <div className="px-5 py-3.5 flex items-center justify-between max-w-5xl mx-auto">
        <Link to={role === "admin" ? "/admin" : "/technician"} className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-hero grid place-items-center">
            <Snowflake className="size-4 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-deep leading-none">FlexHealth</div>
            {subtitle && <div className="text-[11px] text-muted-foreground leading-none mt-0.5">{subtitle}</div>}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-medium text-deep leading-tight">{profile?.full_name || profile?.email}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{role}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
