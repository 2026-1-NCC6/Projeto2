import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "technician" | null;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role;
  profile: { full_name: string | null; tech_code: string | null; email: string } | null;
  loading: boolean;
  extrasLoaded: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<AuthCtx["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [extrasLoaded, setExtrasLoaded] = useState(false);

  const loadExtras = async (uid: string) => {
    const [{ data: roleRow, error: roleError }, { data: prof, error: profileError }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
      supabase.from("profiles").select("full_name, tech_code, email").eq("id", uid).maybeSingle(),
    ]);

    if (roleError) console.error("Failed to load user role", roleError);
    if (profileError) console.error("Failed to load user profile", profileError);

    setRole((roleRow?.role as Role) ?? null);
    setProfile(prof ?? null);
    setExtrasLoaded(true);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setRole(null);
        setProfile(null);
        setExtrasLoaded(false);
        setLoading(false);
        return;
      }
      // Only refetch profile/role on meaningful events to avoid loops
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setExtrasLoaded(false);
        setLoading(true);
        setTimeout(() => {
          loadExtras(s.user.id).finally(() => setLoading(false));
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadExtras(data.session.user.id);
      else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await loadExtras(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, extrasLoaded, refreshProfile, signOut }}>

      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
