import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Bell, Clock, Home } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import NavMenu from "@/components/NavMenu";

export default function EmailPreferences() {
  const { user } = useAuth();
  const { data: preferences, isLoading } = trpc.emailPreferences.getPreferences.useQuery();
  const updateMutation = trpc.emailPreferences.updatePreferences.useMutation();
  const testEmailMutation = trpc.emailPreferences.sendTestEmail.useMutation();
  const [testEmailSent, setTestEmailSent] = useState(false);

  const handleToggleNewCalls = async () => {
    if (!preferences) return;
    
    updateMutation.mutate(
      {
        newCallsNotification: !preferences.newCallsNotification,
      },
      {
        onSuccess: () => {
          toast.success("Preferenze aggiornate");
        },
        onError: (error) => {
          toast.error("Errore nell'aggiornamento delle preferenze");
        },
      }
    );
  };

  const handleToggleDeadlineReminder = async () => {
    if (!preferences) return;
    
    updateMutation.mutate(
      {
        deadlineReminderNotification: !preferences.deadlineReminderNotification,
      },
      {
        onSuccess: () => {
          toast.success("Preferenze aggiornate");
        },
        onError: (error) => {
          toast.error("Errore nell'aggiornamento delle preferenze");
        },
      }
    );
  };

  const handleChangeDaysAhead = async (days: number) => {
    updateMutation.mutate(
      {
        deadlineReminderDays: days,
      },
      {
        onSuccess: () => {
          toast.success("Preferenze aggiornate");
        },
        onError: (error) => {
          toast.error("Errore nell'aggiornamento delle preferenze");
        },
      }
    );
  };

  const handleSendTestEmail = async () => {
    testEmailMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Email di test inviata!");
        setTestEmailSent(true);
        setTimeout(() => setTestEmailSent(false), 3000);
      },
      onError: (error) => {
        toast.error("Errore nell'invio dell'email di test");
      },
    });
  };

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
            <h1 className="text-2xl font-bold text-foreground">Preferenze Notifiche Email</h1>
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
      <main className="container py-12 max-w-2xl">
        {/* Email Address */}
        <Card className="card-marine p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            <Mail className="w-5 h-5 inline mr-2" />
            Email
          </h2>
          <p className="text-foreground font-medium">{user?.email || "Email non disponibile"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Le notifiche email verranno inviate a questo indirizzo.
          </p>
        </Card>

        {/* New Calls Notification */}
        <Card className="card-marine p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifiche Nuovi Bandi
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Ricevi una notifica email quando vengono aggiunti nuovi bandi che corrispondono al tuo livello di abbonamento.
              </p>
            </div>
            <button
              onClick={handleToggleNewCalls}
              disabled={updateMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences?.newCallsNotification ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences?.newCallsNotification ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Deadline Reminder Notification */}
        <Card className="card-marine p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Promemoria Scadenze
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Ricevi una notifica email quando si avvicina la scadenza di un bando.
              </p>
            </div>
            <button
              onClick={handleToggleDeadlineReminder}
              disabled={updateMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences?.deadlineReminderNotification ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences?.deadlineReminderNotification ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {preferences?.deadlineReminderNotification && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">
                Ricordami con quanti giorni di anticipo?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[3, 7, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => handleChangeDaysAhead(days)}
                    disabled={updateMutation.isPending}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      preferences.deadlineReminderDays === days
                        ? "bg-primary text-white"
                        : "bg-background border border-border text-foreground hover:border-primary"
                    }`}
                  >
                    {days} giorni
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Test Email */}
        <Card className="card-marine p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Test Email</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Invia un'email di test per verificare che il sistema sia configurato correttamente.
          </p>
          <Button
            className="btn-marine"
            onClick={handleSendTestEmail}
            disabled={testEmailMutation.isPending || testEmailSent}
          >
            {testEmailMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Invio in corso...
              </>
            ) : testEmailSent ? (
              <>
                ✓ Email inviata!
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Invia Email di Test
              </>
            )}
          </Button>
        </Card>

        {/* Info Section */}
        <Card className="card-marine p-6 mt-6 bg-blue-50 dark:bg-blue-950">
          <h3 className="font-semibold text-foreground mb-2">ℹ️ Informazioni</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Le notifiche email vengono inviate una volta al giorno</li>
            <li>• Puoi disabilitare le notifiche in qualsiasi momento</li>
            <li>• Riceverai notifiche solo per bandi accessibili con il tuo livello di abbonamento</li>
            <li>• Le email contengono link diretti ai bandi per una facile candidatura</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
