import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Anchor, Waves, Compass, Zap, Lock, Globe } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blue-50/30 to-background dark:from-background dark:via-blue-950/20 dark:to-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Waves className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Collettivo Biscaya</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <span className="text-sm text-muted-foreground">{user?.name}</span>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-marine">Accedi</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Naviga il mare della <span className="text-primary">cultura</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Scopri e candidati ai migliori bandi culturali: mostre, residenze d'artista, concorsi, finanziamenti e fellowship. Tutto in un'unica piattaforma.
            </p>
            <div className="flex gap-4">
              <a href={getLoginUrl()}>
                <Button size="lg" className="btn-marine">
                  Inizia Gratuitamente
                </Button>
              </a>
              <Button size="lg" variant="outline">
                Scopri di più
              </Button>
            </div>
          </div>
          <div className="relative h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="w-32 h-32 text-primary/30 animate-pulse" />
            </div>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path
                d="M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z"
                fill="url(#waveGradient)"
              />
              <path
                d="M0,250 Q100,200 200,250 T400,250 L400,400 L0,400 Z"
                fill="rgb(6, 182, 212)"
                opacity="0.1"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Come funziona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Compass,
                title: "Ricerca Avanzata",
                description:
                  "Filtra bandi per tipologia, livello geografico, scadenza e requisiti. Trova esattamente quello che cerchi.",
              },
              {
                icon: Anchor,
                title: "Salva i Tuoi Preferiti",
                description:
                  "Crea una collezione personale dei bandi che ti interessano. Accedi sempre ai tuoi preferiti.",
              },
              {
                icon: Zap,
                title: "Notifiche in Tempo Reale",
                description:
                  "Ricevi avvisi per nuovi bandi e scadenze imminenti. Non perdere mai un'opportunità.",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="card-marine p-6">
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="container py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
          Scegli il tuo livello di accesso
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Base",
              price: "€30/mese",
              color: "blue",
              features: [
                "Bandi regionali",
                "Ricerca e filtri",
                "Salva preferiti",
                "Notifiche di base",
              ],
              level: "base",
            },
            {
              name: "Premium",
              price: "€50/mese",
              color: "purple",
              features: [
                "Tutto di Base +",
                "Bandi nazionali",
                "Notifiche avanzate",
                "Supporto prioritario",
              ],
              level: "premium",
              highlight: true,
            },
            {
              name: "Pro",
              price: "€90/mese",
              color: "amber",
              features: [
                "Tutto di Premium +",
                "Bandi europei",
                "Analisi opportunità",
                "Consulenza dedicata",
              ],
              level: "pro",
            },
          ].map((tier, idx) => (
            <Card
              key={idx}
              className={`card-marine p-8 relative ${
                tier.highlight ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className={`badge-${tier.level} px-4 py-1`}>
                    Più popolare
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                {tier.name}
              </h3>
              <p className="text-3xl font-bold text-primary mb-6">{tier.price}</p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="w-4 h-4 text-secondary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={tier.highlight ? "btn-marine w-full" : "w-full"}
                variant={tier.highlight ? "default" : "outline"}
              >
                {tier.price === "Gratuito" ? "Inizia Ora" : "Sottoscrivi"}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Pronto a scoprire le tue prossime opportunità?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Unisciti a centinaia di artisti e operatori culturali che stanno già navigando il mare della cultura con Collettivo Biscaya.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="btn-marine">
              Accedi Gratuitamente
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Collettivo Biscaya</h4>
              <p className="text-sm text-muted-foreground">
                Naviga le possibilità nel mare della cultura.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Piattaforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Bandi</a></li>
                <li><a href="#" className="hover:text-primary">Dashboard</a></li>
                <li><a href="#" className="hover:text-primary">Sottoscrizioni</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Informazioni</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Chi Siamo</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Contatti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legale</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-primary">Termini</a></li>
                <li><a href="#" className="hover:text-primary">Cookie</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Collettivo Biscaya. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
