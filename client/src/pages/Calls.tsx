import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader as Loader2, Heart, ExternalLink, MapPin, Calendar, Chrome as Home, Lock } from "lucide-react";
import { Link } from "wouter";
import NavMenu from "@/components/NavMenu";
import { useState } from "react";
import { getLoginUrl } from "@/const";

export default function Calls() {
  const { user, isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [callType, setCallType] = useState<string>("all");
  const [geographicLevel, setGeographicLevel] = useState<string>("all");

  const { data: calls = [], isLoading } = trpc.calls.search.useQuery({
    query: query || undefined,
    callType: callType && callType !== "all" ? (callType as any) : undefined,
    geographicLevel: geographicLevel && geographicLevel !== "all" ? (geographicLevel as any) : undefined,
  });

  const { data: savedCalls = [] } = trpc.savedCalls.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const saveMutation = trpc.savedCalls.save.useMutation();
  const removeMutation = trpc.savedCalls.remove.useMutation();

  const savedCallIds = new Set(savedCalls.map((c) => String(c.id)));
  
  // Limit preview for non-authenticated users
  const displayCalls = isAuthenticated ? calls : calls.slice(0, 20);
  const isPreview = !isAuthenticated && calls.length > 20;

  const handleToggleSave = (callId: string | number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const id = String(callId);
    if (savedCallIds.has(id)) {
      removeMutation.mutate(typeof callId === "number" ? callId : 0);
    } else {
      saveMutation.mutate(typeof callId === "number" ? callId : 0);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <NavMenu />
            <h1 className="text-2xl font-bold text-foreground">Bandi Culturali</h1>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" title="Torna alla Home">
                  <Home className="w-5 h-5 text-primary" />
                </Button>
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <Card className="card-marine p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Filtri
              </h2>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Ricerca
                  </label>
                  <Input
                    placeholder="Titolo, ente..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-input"
                  />
                </div>

                {/* Call Type */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Tipologia
                  </label>
                  <Select value={callType} onValueChange={setCallType}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Tutte le tipologie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      <SelectItem value="exhibition">Mostra</SelectItem>
                      <SelectItem value="residency">Residenza d'artista</SelectItem>
                      <SelectItem value="competition">Concorso</SelectItem>
                      <SelectItem value="grant">Finanziamento</SelectItem>
                      <SelectItem value="award">Premio</SelectItem>
                      <SelectItem value="fellowship">Fellowship</SelectItem>
                      <SelectItem value="curatorial_open_call">
                        Open Call Curatoriale
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Geographic Level */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Livello Geografico
                  </label>
                  <Select value={geographicLevel} onValueChange={setGeographicLevel}>
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Tutti i livelli" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="regional">Regionale</SelectItem>
                      <SelectItem value="national">Nazionale</SelectItem>
                      <SelectItem value="european">Europeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setQuery("");
                    setCallType("all");
                    setGeographicLevel("all");
                  }}
                >
                  Azzera filtri
                </Button>
              </div>
            </Card>
          </div>

          {/* Calls List */}
          <div className="md:col-span-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : displayCalls.length === 0 ? (
              <Card className="card-marine p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Nessun bando trovato con i filtri selezionati.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setCallType("all");
                    setGeographicLevel("all");
                  }}
                >
                  Azzera filtri
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {displayCalls.map((call: any) => (
                  <Card key={call.id} className="card-marine p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link href={`/calls/${call.id}`}>
                          <h3 className="text-lg font-semibold text-primary hover:underline cursor-pointer">
                            {call.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {call.entity}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className={`level-indicator ${getLevelColor(call.geographicLevel)}`}>
                            <MapPin className="w-4 h-4" />
                            {getLevelLabel(call.geographicLevel)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {getCallTypeLabel(call.callType)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(call.deadline).toLocaleDateString("it-IT")}
                          </span>
                        </div>

                        {call.qualitativeNotes && (
                          <p className="text-sm text-foreground mt-3">
                            {call.qualitativeNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleSave(call.id)}
                          className={savedCallIds.has(String(call.id)) ? "text-red-500" : ""}
                        >
                          <Heart
                            className="w-5 h-5"
                            fill={savedCallIds.has(String(call.id)) ? "currentColor" : "none"}
                          />
                        </Button>
                        <Link href={`/calls/${call.id}`}>
                          <Button size="icon" variant="outline">
                            <ExternalLink className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {isPreview && (
                  <Card className="card-marine p-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-primary">
                    <div className="text-center">
                      <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Accedi per vedere tutti i bandi
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Stai visualizzando un'anteprima di {displayCalls.length} bandi su {calls.length} disponibili.
                      </p>
                      <div className="flex gap-4 justify-center flex-wrap">
                        <Button
                          onClick={() => window.location.href = getLoginUrl()}
                          size="lg"
                          className="bg-primary hover:bg-primary/90"
                        >
                          Accedi Gratuitamente
                        </Button>
                        <Link href="/#pricing">
                          <Button variant="outline" size="lg">
                            Vedi i Piani
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
