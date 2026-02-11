import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Home } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import NavMenu from "@/components/NavMenu";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      navigate("/");
      toast.error("Accesso negato. Solo gli amministratori possono accedere a questa pagina.");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user || user.role !== "admin") {
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
            <h1 className="text-2xl font-bold text-foreground">Area Amministrativa</h1>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" title="Torna alla Home">
                  <Home className="w-5 h-5 text-primary" />
                </Button>
              </Link>
              <Button className="btn-marine">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Bando
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="card-marine p-6">
            <p className="text-sm text-muted-foreground mb-2">Bandi Totali</p>
            <p className="text-3xl font-bold text-primary">10</p>
          </Card>
          <Card className="card-marine p-6">
            <p className="text-sm text-muted-foreground mb-2">Bandi Attivi</p>
            <p className="text-3xl font-bold text-primary">10</p>
          </Card>
          <Card className="card-marine p-6">
            <p className="text-sm text-muted-foreground mb-2">Utenti Registrati</p>
            <p className="text-3xl font-bold text-primary">-</p>
          </Card>
          <Card className="card-marine p-6">
            <p className="text-sm text-muted-foreground mb-2">Bandi Salvati</p>
            <p className="text-3xl font-bold text-primary">-</p>
          </Card>
        </div>

        {/* Calls Management */}
        <Card className="card-marine p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Gestione Bandi
          </h2>
          <p className="text-muted-foreground mb-6">
            Gestisci i bandi culturali della piattaforma. Puoi aggiungere, modificare o eliminare bandi.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div>
                <h3 className="font-semibold text-foreground">
                  Casasanvito Open Call 2026
                </h3>
                <p className="text-sm text-muted-foreground">
                  Residenza d'artista • Regionale • Scadenza: 31/01/2026
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div>
                <h3 className="font-semibold text-foreground">
                  MYllennium Award 2026
                </h3>
                <p className="text-sm text-muted-foreground">
                  Premio • Nazionale • Scadenza: 04/05/2026
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div>
                <h3 className="font-semibold text-foreground">
                  Étant donnés Program 2026
                </h3>
                <p className="text-sm text-muted-foreground">
                  Finanziamento • Europeo • Scadenza: 14/02/2026
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button className="mt-6">
            <Plus className="w-4 h-4 mr-2" />
            Carica altri bandi
          </Button>
        </Card>

        {/* Users Management */}
        <Card className="card-marine p-6 mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Gestione Utenti
          </h2>
          <p className="text-muted-foreground mb-6">
            Visualizza e gestisci gli utenti registrati sulla piattaforma.
          </p>

          <div className="bg-background rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">
              Nessun utente registrato al momento.
            </p>
          </div>
        </Card>

        {/* Notifications Management */}
        <Card className="card-marine p-6 mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Gestione Notifiche
          </h2>
          <p className="text-muted-foreground mb-6">
            Invia notifiche agli utenti su nuovi bandi e scadenze imminenti.
          </p>

          <Button className="btn-marine">
            <Plus className="w-4 h-4 mr-2" />
            Invia Notifica
          </Button>
        </Card>
      </main>
    </div>
  );
}
