import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Snowflake } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    redirectByRole();
  }, []);

  const redirectByRole = async () => {
    const user = await base44.auth.me();
    if (!user.profile_complete) {
      navigate("/complete-profile", { replace: true });
    } else if (user.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/tech", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <Snowflake className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">FlexHealth</h1>
        <p className="text-sm text-muted-foreground">Cadeia de Frio Farmacêutica</p>
        {loading && (
          <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mt-4" />
        )}
      </motion.div>
    </div>
  );
}