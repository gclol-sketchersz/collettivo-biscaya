import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Anchor, Loader as Loader2 } from "lucide-react";

type Mode = "login" | "register";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function AuthModal({ open, onOpenChange, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => setError(e.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e) => setError(e.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ email, name, password });
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setEmail("");
    setName("");
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Anchor className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Collettivo Biscaya</span>
          </div>
          <DialogTitle className="text-2xl font-bold">
            {mode === "login" ? "Accedi al tuo account" : "Crea un account"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Nome completo
              </label>
              <Input
                type="text"
                placeholder="Mario Rossi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="nome@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Password
            </label>
            <Input
              type="password"
              placeholder={mode === "register" ? "Minimo 6 caratteri" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="btn-marine w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {mode === "login" ? "Accedi" : "Registrati"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
          {mode === "login" ? (
            <>
              Non hai un account?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => switchMode("register")}
              >
                Registrati
              </button>
            </>
          ) : (
            <>
              Hai già un account?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => switchMode("login")}
              >
                Accedi
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
