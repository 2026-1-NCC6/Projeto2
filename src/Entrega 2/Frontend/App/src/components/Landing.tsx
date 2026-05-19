import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Snowflake, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-hero grid place-items-center shadow-elevated">
            <Snowflake className="size-5 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-deep">FlexHealth</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" className="font-medium">Entrar</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 pt-8 pb-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6">
            <span className="size-1.5 rounded-full bg-success animate-live" />
            Cadeia fria monitorada em tempo real
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-deep leading-[1.05]">
            Cada grau conta.<br />
            <span className="bg-hero bg-clip-text text-transparent">FlexHealth garante.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
            Monitore temperatura e umidade do transporte de medicamentos termossensíveis,
            de ponta a ponta. Alertas em tempo real, histórico completo e rastreabilidade
            para técnicos e gestores.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-hero shadow-elevated hover:opacity-95 transition w-full sm:w-auto">
                Começar agora
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Tenho uma conta
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-16">
          {[
            { icon: Thermometer, title: "Faixa 2°C – 8°C", desc: "Alertas instantâneos quando sai do range." },
            { icon: Activity, title: "Leitura a cada 3s", desc: "Sensores ESP32 com persistência confiável." },
            { icon: ShieldCheck, title: "Auditoria total", desc: "Histórico de viagens, sinistros e leituras." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card"
            >
              <div className="size-10 rounded-xl bg-secondary grid place-items-center mb-3">
                <f.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-deep">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        FlexHealth · Cadeia fria sob controle
      </footer>
    </div>
  );
}
