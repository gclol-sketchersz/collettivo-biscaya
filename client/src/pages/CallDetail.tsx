import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader as Loader2, Heart, ExternalLink, MapPin, Calendar, Users, Award, Chrome as Home, Lock } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import NavMenu from "@/components/NavMenu";
import { getLoginUrl } from "@/const";

export default function CallDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const callId = id || "0";

  const { data: call, isLoading } = trpc.calls.getById.useQuery(callId);
  const { data: savedCalls = [] } = trpc.savedCalls.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const saveMutation = trpc.savedCalls.save.useMutation();
  const removeMutation = trpc.savedCalls.remove.useMutation();

  const [isSaved, setIsSaved] = useState(
    savedCalls.some((c) => String(c.id) === String(callId))
  );

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const numericId = typeof callId === "number" ? callId : parseInt(callId) || 0;
    if (isSaved) {
      removeMutation.mutate(numericId, {
        onSuccess: () => setIsSaved(false),
      });
    } else {
      saveMutation.mutate(numericId, {
        onSuccess: () => setIsSaved(true),
      });
    }
  };

  const getCallTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exhibition: "Mostra",
      residency: "Residenza d'artista",
      competition: "Concorso",
      grant: "Finanziamento",
      award: "Premio",
      fellowship: "Fellowship",
      curatorial_open_call: "Open Call Curatoriale",
    };
    return labels[type] || type;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      regional: "Regionale",
      national: "Nazionale",
      european: "Europeo",
    };
    return labels[level] || level;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "regional":
        return "level-regional";
      case "national":
        return "level-national";
      case "european":
        return "level-european";
      default:
        return "level-regional";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="card-marine p-8">
          <p className="text-muted-foreground">Bando non trovato</p>
          <Link href="/calls">
            <Button className="mt-4">Torna ai bandi</Button>
          </Link>
        </Card>
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
            <Link href="/calls">
              <Button variant="ghost">← Torna ai bandi</Button>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" title="Torna alla Home">
                  <Home className="w-5 h-5 text-primary" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="card-marine p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {call.title}
                </h1>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className={`level-indicator ${getLevelColor(call.geographicLevel)}`}>
                    <MapPin className="w-4 h-4" />
                    {getLevelLabel(call.geographicLevel)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {getCallTypeLabel(call.callType)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Scadenza: {new Date(call.deadline).toLocaleDateString("it-IT")}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleToggleSave}
                    className={isSaved ? "text-red-500" : ""}
                  >
                    <Heart
                      className="w-4 h-4 mr-2"
                      fill={isSaved ? "currentColor" : "none"}
                    />
                    {isSaved ? "Salvato" : "Salva"}
                  </Button>
                  {(call as any).sourceUrl && (
                    <a href={(call as any).sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="default">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visita il sito
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {(call as any).description && (
              <div className="border-t border-border pt-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Descrizione
                </h2>
                <p className="text-foreground whitespace-pre-wrap">
                  {(call as any).description}
                </p>
              </div>
              )}

              {call.qualitativeNotes && (
                <div className="border-t border-border pt-6 mt-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Note
                  </h2>
                  <p className="text-foreground">
                    {call.qualitativeNotes}
                  </p>
                </div>
              )}

              {call.requirements && (
                <div className="border-t border-border pt-6 mt-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Requisiti
                  </h2>
                  <p className="text-foreground whitespace-pre-wrap">
                    {call.requirements}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            {/* Info Card */}
            <Card className="card-marine p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Informazioni
              </h3>
              <div className="space-y-4">
                {call.entity && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ente</p>
                    <p className="text-foreground font-medium">{call.entity}</p>
                  </div>
                )}
                {call.country && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paese</p>
                    <p className="text-foreground font-medium">{call.country}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Scadenza</p>
                  <p className="text-foreground font-medium">
                    {new Date(call.deadline).toLocaleDateString("it-IT")}
                  </p>
                </div>
              </div>
            </Card>

            {/* CTA Card */}
            {!isAuthenticated && (
              <Card className="card-marine p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-primary">
                <Lock className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Accedi per salvare
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea un account per salvare i tuoi bandi preferiti e ricevere notifiche.
                </p>
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 mb-2"
                >
                  Accedi Gratuitamente
                </Button>
                <Link href="/#pricing">
                  <Button variant="outline" size="sm" className="w-full">
                    Vedi i Piani
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
