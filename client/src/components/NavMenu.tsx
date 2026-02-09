import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Waves, LogOut, Settings, BarChart3, Users, Mail, CreditCard, Home, TrendingUp } from "lucide-react";

export default function NavMenu() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  const isAdmin = user?.role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="gap-2 hover:bg-primary/10">
          <Waves className="w-5 h-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-card border-border">
        <DropdownMenuLabel className="text-foreground font-semibold">
          {user?.name || "Menu"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        {/* Home Button */}
        <Link href="/">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-foreground">
            <Home className="w-4 h-4 mr-2 text-primary" />
            <span>Home</span>
          </DropdownMenuItem>
        </Link>

        {/* Main Navigation */}
        <Link href="/calls">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-foreground">
            <BarChart3 className="w-4 h-4 mr-2 text-primary" />
            <span>Bandi Culturali</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/dashboard">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-foreground">
            <BarChart3 className="w-4 h-4 mr-2 text-primary" />
            <span>Dashboard</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/advanced-search">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-foreground">
            <BarChart3 className="w-4 h-4 mr-2 text-primary" />
            <span>Ricerca Avanzata</span>
          </DropdownMenuItem>
        </Link>

        {isAdmin && (
          <Link href="/statistics">
            <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-foreground">
              <TrendingUp className="w-4 h-4 mr-2 text-primary" />
              <span>Statistiche</span>
            </DropdownMenuItem>
          </Link>
        )}

        <DropdownMenuSeparator className="bg-border" />

        {/* Account Settings */}
        <Link href="/subscriptions">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-foreground">
            <CreditCard className="w-4 h-4 mr-2 text-secondary" />
            <span>Sottoscrizioni</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/email-preferences">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-foreground">
            <Mail className="w-4 h-4 mr-2 text-secondary" />
            <span>Preferenze Email</span>
          </DropdownMenuItem>
        </Link>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-amber-600 font-semibold text-xs">
              ADMIN
            </DropdownMenuLabel>
            <Link href="/admin">
              <DropdownMenuItem className="cursor-pointer hover:bg-amber-50/20 text-foreground">
                <Users className="w-4 h-4 mr-2 text-amber-600" />
                <span>Gestione Bandi</span>
              </DropdownMenuItem>
            </Link>
          </>
        )}

        <DropdownMenuSeparator className="bg-border" />

        {/* Logout */}
        <DropdownMenuItem
          className="cursor-pointer hover:bg-destructive/10 text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Esci</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
