import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Loader2, Search, Filter, X, Home } from "lucide-react";
import { toast } from "sonner";
import NavMenu from "@/components/NavMenu";

const CALL_TYPE_LABELS: Record<string, string> = {
  exhibition: "Mostra",
  residency: "Residenza d'artista",
  competition: "Concorso",
  grant: "Finanziamento/Grant",
  award: "Premio",
  fellowship: "Fellowship",
  curatorial_open_call: "Open call curatoriale",
};

const GEOGRAPHIC_LEVEL_LABELS: Record<string, string> = {
  regional: "Regionale",
  national: "Nazionale",
  european: "Europeo",
};

export default function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetMin, setBudgetMin] = useState<number | undefined>();
  const [budgetMax, setBudgetMax] = useState<number | undefined>();
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [deadlineFrom, setDeadlineFrom] = useState<string>("");
  const [deadlineTo, setDeadlineTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"deadline-asc" | "deadline-desc" | "budget-asc" | "budget-desc" | "relevance">("relevance");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  const { data: budgetStats } = trpc.advancedSearch.getBudgetStats.useQuery();
  const { data: filterOptions } = trpc.advancedSearch.getFilterOptions.useQuery();

  const { data: searchResults, isLoading } = trpc.advancedSearch.search.useQuery({
    searchQuery: searchQuery || undefined,
    budgetMin: budgetMin,
    budgetMax: budgetMax,
    geographicLevels: selectedLevels.length > 0 ? (selectedLevels as any) : undefined,
    callTypes: selectedTypes.length > 0 ? (selectedTypes as any) : undefined,
    deadlineFrom: deadlineFrom ? new Date(deadlineFrom) : undefined,
    deadlineTo: deadlineTo ? new Date(deadlineTo) : undefined,
    sortBy,
    page,
    pageSize: 12,
  });

  const handleToggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
    setPage(1);
  };

  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setBudgetMin(undefined);
    setBudgetMax(undefined);
    setSelectedLevels([]);
    setSelectedTypes([]);
    setDeadlineFrom("");
    setDeadlineTo("");
    setSortBy("relevance");
    setPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery ||
      budgetMin !== undefined ||
      budgetMax !== undefined ||
      selectedLevels.length > 0 ||
      selectedTypes.length > 0 ||
      deadlineFrom ||
      deadlineTo ||
      sortBy !== "relevance"
    );
  }, [searchQuery, budgetMin, budgetMax, selectedLevels, selectedTypes, deadlineFrom, deadlineTo, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <NavMenu />
            <h1 className="text-2xl font-bold text-foreground">Ricerca Avanzata Bandi</h1>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" title="Torna alla Home">
                  <Home className="w-5 h-5 text-primary" />
                </Button>
              </Link>
              <Link href="/calls">
                <Button variant="ghost">← Ricerca Semplice</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <Card className="card-marine p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtri
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Ripristina
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Ricerca
                </label>
                <input
                  type="text"
                  placeholder="Titolo, ente..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              {/* Budget */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Budget (EUR)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={budgetMin || ""}
                    onChange={(e) => {
                      setBudgetMin(e.target.value ? parseInt(e.target.value) : undefined);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={budgetMax || ""}
                    onChange={(e) => {
                      setBudgetMax(e.target.value ? parseInt(e.target.value) : undefined);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  />
                </div>
                {budgetStats && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Range: {budgetStats.minBudget.toLocaleString()} - {budgetStats.maxBudget.toLocaleString()} EUR
                  </p>
                )}
              </div>

              {/* Geographic Level */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Livello Geografico
                </label>
                <div className="space-y-2">
                  {filterOptions?.geographicLevels.map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level)}
                        onChange={() => handleToggleLevel(level)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-foreground">
                        {GEOGRAPHIC_LEVEL_LABELS[level]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Call Type */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Tipologia
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions?.callTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleToggleType(type)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-foreground">
                        {CALL_TYPE_LABELS[type]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Scadenza
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={deadlineFrom}
                    onChange={(e) => {
                      setDeadlineFrom(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  />
                  <input
                    type="date"
                    value={deadlineTo}
                    onChange={(e) => {
                      setDeadlineTo(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Ordina per
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="relevance">Rilevanza</option>
                  <option value="deadline-asc">Scadenza (prossima)</option>
                  <option value="deadline-desc">Scadenza (lontana)</option>
                  <option value="budget-asc">Budget (basso)</option>
                  <option value="budget-desc">Budget (alto)</option>
                </select>
              </div>
            </Card>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Toggle Filters Button (Mobile) */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Nascondi Filtri" : "Mostra Filtri"}
              </Button>
            </div>

            {/* Results Info */}
            {searchResults && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  Trovati <strong>{searchResults.pagination.total}</strong> bandi
                  {hasActiveFilters && " con i filtri selezionati"}
                </p>
              </div>
            )}

            {/* Results Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : searchResults && searchResults.calls.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {searchResults.calls.map((call: any) => (
                    <Link key={call.id} href={`/calls/${call.id}`}>
                      <Card className="card-marine p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {call.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">{call.entity}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Tipologia:</span>
                            <span className="text-foreground font-medium">
                              {CALL_TYPE_LABELS[call.callType]}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Livello:</span>
                            <span className="text-foreground font-medium">
                              {GEOGRAPHIC_LEVEL_LABELS[call.geographicLevel]}
                            </span>
                          </div>
                          {call.budgetMin && call.budgetMax && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Budget:</span>
                              <span className="text-foreground font-medium">
                                {call.budgetMin.toLocaleString()} - {call.budgetMax.toLocaleString()} {call.budgetCurrency}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Scadenza:</span>
                            <span className="text-foreground font-medium">
                              {new Date(call.deadline).toLocaleDateString("it-IT")}
                            </span>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Visualizza Dettagli →
                        </Button>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    ← Precedente
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    Pagina {searchResults.pagination.page} di {searchResults.pagination.totalPages}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= searchResults.pagination.totalPages}
                  >
                    Successiva →
                  </Button>
                </div>
              </>
            ) : (
              <Card className="card-marine p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? "Nessun bando corrisponde ai filtri selezionati"
                    : "Usa i filtri per cercare bandi"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
