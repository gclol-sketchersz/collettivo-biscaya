import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, ExternalLink, MapPin, Calendar, Users, Award, Home } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import NavMenu from "@/components/NavMenu";

export default function CallDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const callId = parseInt(id || "0");

  const { data: call, isLoading } = trpc.calls.getById.useQuery(callId);
  const { data: savedCalls = [] } = trpc.savedCalls.getAll.useQuery();
  const saveMutation = trpc.savedCalls.save.useMutation();
  const removeMutation = trpc.savedCalls.remove.useMutation();

  const [isSaved, setIsSaved] = useState(
    savedCalls.some((c) => c.id === callId)
  );

  const handleToggleSave = () => {
    if (isSaved) {
      removeMutation.mutate(callId, {
        onSuccess: () => setIsSaved(false),
      });
    } else {
      saveMutation.mutate(callId, {
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
            <Link href="/">
              <Button variant="ghost" size="icon" title="Torna alla Home">
                <Home className="w-5 h-5 text-primary" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSave}
              className={isSaved ? "text-red-500" : ""}
            >
              <Heart
                className="w-5 h-5"
                fill={isSaved ? "currentColor" : "none"}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Title Section */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {call.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">{call.entity}</p>
              <div className="flex flex-wrap gap-3">
                <span className={`level-indicator ${getLevelColor(call.geographicLevel)}`}>
                  <MapPin className="w-4 h-4" />
                  {getLevelLabel(call.geographicLevel)}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                  {getCallTypeLabel(call.callType)}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Scadenza: {new Date(call.deadline).toLocaleDateString("it-IT")}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="card-marine p-6">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Paese
                </h3>
                <p className="text-muted-foreground">{call.country}</p>
              </Card>
              <Card className="card-marine p-6">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Scadenza
                </h3>
                <p className="text-muted-foreground">
                  {new Date(call.deadline).toLocaleDateString("it-IT", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </Card>
            </div>

            {/* Sections */}
            {call.requirements && (
              <Card className="card-marine p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Requisiti
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <p>{call.requirements}</p>
                </div>
              </Card>
            )}

            {call.benefits && (
              <Card className="card-marine p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  Benefici e Offerte
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <p>{call.benefits}</p>
                </div>
              </Card>
            )}

            {call.accessibility && (
              <Card className="card-marine p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Accessibilità
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <p>{call.accessibility}</p>
                </div>
              </Card>
            )}

            {call.qualitativeNotes && (
              <Card className="card-marine p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Note Qualitative
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <p>{call.qualitativeNotes}</p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Quick Info */}
            <Card className="card-marine p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Informazioni Rapide
              </h2>

              <div className="space-y-4">
                {call.costs && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Costi</p>
                    <p className="font-semibold text-foreground">{call.costs}</p>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Ente Promotore</p>
                  <p className="font-semibold text-foreground">{call.entity}</p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Tipo</p>
                  <p className="font-semibold text-foreground">
                    {getCallTypeLabel(call.callType)}
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Livello</p>
                  <p className="font-semibold text-foreground">
                    {getLevelLabel(call.geographicLevel)}
                  </p>
                </div>
              </div>

              {call.externalLink && (
                <a href={call.externalLink} target="_blank" rel="noopener noreferrer">
                  <Button className="btn-marine w-full mt-6">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Vai al Bando
                  </Button>
                </a>
              )}

              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={handleToggleSave}
              >
                <Heart
                  className="w-4 h-4 mr-2"
                  fill={isSaved ? "currentColor" : "none"}
                />
                {isSaved ? "Salvato" : "Salva Bando"}
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
