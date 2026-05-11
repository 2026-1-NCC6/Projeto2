import { Snowflake, LogOut, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader({ userName, role, onLogout, isOnline = true }) {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Snowflake className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">FlexHealth</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {userName} · {role === "tech" ? "Técnico" : "Admin"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-destructive" />
                <span className="text-[11px] font-medium text-destructive">Offline</span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}