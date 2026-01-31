import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, Bell, Settings, LogOut, Home } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user's subscription
  const { data: subscription, isLoading: subLoading } =
    trpc.subscriptions.getCurrent.useQuery();

  // Fetch saved calls
  const { data: savedCalls = [], isLoading: savedLoading } =
    trpc.savedCalls.getAll.useQuery();

  // Fetch notifications
  const { data: notifications = [], isLoading: notifLoading } =
    trpc.notifications.getAll.useQuery({ limit: 5 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getLevelBadgeClass = (level?: string) => {
    switch (level) {
      case "premium":
        return "badge-premium";
      case "pro":
        return "badge-pro";
      default:
        return "badge-base";
    }
  };

  const getLevelLabel = (level?: string) => {
    switch (level) {
      case "premium":
        return "Premium";
      case "pro":
        return "Pro";
      default:
        return "Base";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Benvenuto, {user.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" title="Torna alla Home">
                <Home className="w-5 h-5 text-primary" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Subscription Status */}
            <Card className="card-marine p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Il tuo abbonamento
                </h2>
                <span className={`${getLevelBadgeClass(subscription?.level)} px-4 py-2 rounded-full`}>
                  {getLevelLabel(subscription?.level)}
                </span>
              </div>
              <p className="text-muted-foreground mb-6">
                {subscription?.level === "base" &&
                  "Accedi ai bandi regionali. Upgrade a Premium per i bandi nazionali."}
                {subscription?.level === "premium" &&
                  "Accedi ai bandi regionali e nazionali. Upgrade a Pro per i bandi europei."}
                {subscription?.level === "pro" &&
                  "Accedi a tutti i bandi: regionali, nazionali ed europei."}
              </p>
              <Button className="btn-marine">Gestisci Abbonamento</Button>
            </Card>

            {/* Saved Calls */}
            <Card className="card-marine p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Bandi Salvati
                </h2>
                <span className="text-sm text-muted-foreground">
                  {savedLoading ? "..." : savedCalls.length}
                </span>
              </div>

              {savedLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : savedCalls.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  Non hai ancora salvato nessun bando. Inizia a esplorare!
                </p>
              ) : (
                <div className="space-y-4">
                  {savedCalls.slice(0, 3).map((call) => (
                    <div
                      key={call.id}
                      className="p-4 bg-background rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      <h3 className="font-semibold text-foreground mb-1">
                        {call.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {call.entity} • {call.country}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <span className={`level-indicator level-${call.geographicLevel}`}>
                          {call.geographicLevel === "regional"
                            ? "Regionale"
                            : call.geographicLevel === "national"
                            ? "Nazionale"
                            : "Europeo"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {savedCalls.length > 3 && (
                    <Button variant="outline" className="w-full">
                      Visualizza tutti ({savedCalls.length})
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Notifications */}
            <Card className="card-marine p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifiche
                </h2>
              </div>

              {notifLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nessuna notifica
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg text-sm ${
                        notif.isRead
                          ? "bg-background text-muted-foreground"
                          : "bg-primary/10 text-foreground border border-primary/20"
                      }`}
                    >
                      <p className="font-medium">{notif.title}</p>
                      {notif.message && (
                        <p className="text-xs mt-1 opacity-75">{notif.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="card-marine p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Statistiche
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bandi Salvati</p>
                  <p className="text-2xl font-bold text-primary">
                    {savedLoading ? "..." : savedCalls.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notifiche</p>
                  <p className="text-2xl font-bold text-primary">
                    {notifLoading ? "..." : notifications.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
