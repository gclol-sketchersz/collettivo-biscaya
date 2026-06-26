import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader as Loader2, Lock } from "lucide-react";
import AuthModal from "@/components/AuthModal";

type Props = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="card-marine p-10 text-center max-w-md w-full">
          <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Accesso richiesto
          </h2>
          <p className="text-muted-foreground mb-6">
            Devi accedere o registrarti per visualizzare i bandi culturali.
          </p>
          <Button
            className="btn-marine w-full"
            onClick={() => setModalOpen(true)}
          >
            Accedi / Registrati
          </Button>
        </Card>
        <AuthModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    );
  }

  return <>{children}</>;
}
