import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, ArrowRight, Home } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import NavMenu from "@/components/NavMenu";

export default function Subscriptions() {
  const { user } = useAuth();
  const { data: subscription, isLoading } = trpc.subscriptions.getCurrent.useQuery();
  const updateMutation = trpc.subscriptions.update.useMutation();

  const handleUpgrade = (level: "base" | "premium" | "pro") => {
    updateMutation.mutate(level, {
      onSuccess: () => {
        toast.success(`Abbonamento aggiornato a ${level}`);
      },
      onError: (error) => {
        toast.error("Errore nell'aggiornamento dell'abbonamento");
      },
    });
  };

  const currentLevel = subscription?.level || "base";

  const tiers = [
    {
      name: "Base",
      level: "base" as const,
      price: "€30/mese",
      description: "Perfetto per iniziare",
      features: [
        "Bandi regionali",
        "Ricerca e filtri",
        "Salva preferiti",
        "Notifiche di base",
        "Accesso illimitato",
      ],
      color: "blue",
    },
    {
      name: "Premium",
      level: "premium" as const,
      price: "€50/mese",
      description: "Per professionisti",
      features: [
        "Tutto di Base +",
        "Bandi nazionali",
        "Notifiche avanzate",
        "Supporto prioritario",
        "Esportazione dati",
      ],
      color: "purple",
      highlight: true,
    },
    {
      name: "Pro",
      level: "pro" as const,
      price: "€90/mese",
      description: "Accesso completo",
      features: [
        "Tutto di Premium +",
        "Bandi europei",
        "Analisi opportunità",
        "Consulenza dedicata",
        "API access",
      ],
      color: "amber",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <NavMenu />
            <h1 className="text-2xl font-bold text-foreground">Gestisci Abbonamento</h1>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" title="Torna alla Home">
                  <Home className="w-5 h-5 text-primary" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {/* Current Subscription */}
        <div className="mb-12">
          <Card className="card-marine p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Abbonamento Attuale
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Piano attivo</p>
                <p className="text-3xl font-bold text-primary capitalize">
                  {currentLevel}
                </p>
              </div>
              <div className={`badge-${currentLevel} px-6 py-3 rounded-lg text-lg font-semibold`}>
                {currentLevel === "base"
                  ? "€30/mese"
                  : currentLevel === "premium"
                  ? "€50/mese"
                  : "€90/mese"}
              </div>
            </div>
          </Card>
        </div>

        {/* Subscription Tiers */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-8">Scegli il tuo piano</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card
                key={tier.level}
                className={`card-marine p-8 relative transition-all ${
                  tier.highlight ? "ring-2 ring-primary scale-105" : ""
                } ${currentLevel === tier.level ? "border-primary border-2" : ""}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className={`badge-${tier.level} px-4 py-1`}>
                      Più popolare
                    </span>
                  </div>
                )}

                {currentLevel === tier.level && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Check className="w-3 h-3" />
                      Attivo
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {tier.description}
                </p>
                <p className="text-3xl font-bold text-primary mb-8">{tier.price}</p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {currentLevel === tier.level ? (
                  <Button disabled className="w-full">
                    Piano Attuale
                  </Button>
                ) : currentLevel === "base" && tier.level === "premium" ? (
                  <Button
                    className="btn-marine w-full"
                    onClick={() => handleUpgrade(tier.level)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      <>
                        Upgrade <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : currentLevel === "base" && tier.level === "pro" ? (
                  <Button
                    className="btn-marine w-full"
                    onClick={() => handleUpgrade(tier.level)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      <>
                        Upgrade <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : currentLevel === "premium" && tier.level === "pro" ? (
                  <Button
                    className="btn-marine w-full"
                    onClick={() => handleUpgrade(tier.level)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      <>
                        Upgrade <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Piano Precedente
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Domande Frequenti</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-marine p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Posso cambiare piano in qualsiasi momento?
              </h3>
              <p className="text-muted-foreground text-sm">
                Sì, puoi aggiornare o downgrade il tuo piano in qualsiasi momento. I cambiamenti avranno effetto immediatamente.
              </p>
            </Card>
            <Card className="card-marine p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Cosa succede se downgrade il mio piano?
              </h3>
              <p className="text-muted-foreground text-sm">
                Se fai il downgrade, perderai accesso ai bandi di livello superiore, ma manterrai i tuoi dati salvati.
              </p>
            </Card>
            <Card className="card-marine p-6">
              <h3 className="font-semibold text-foreground mb-2">
                È disponibile una prova gratuita?
              </h3>
              <p className="text-muted-foreground text-sm">
                Sì! Il piano Base è completamente gratuito e ti dà accesso ai bandi regionali senza limiti di tempo.
              </p>
            </Card>
            <Card className="card-marine p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Quali sono le differenze tra i piani?
              </h3>
              <p className="text-muted-foreground text-sm">
                Base: bandi regionali. Premium: bandi nazionali. Pro: bandi europei + funzioni avanzate.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
