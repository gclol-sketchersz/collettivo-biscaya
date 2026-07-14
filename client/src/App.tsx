import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Calls from "./pages/Calls";
import CallDetail from "./pages/CallDetail";
import Subscriptions from "./pages/Subscriptions";
import Admin from "./pages/Admin";
import EmailPreferences from "./pages/EmailPreferences";
import AdvancedSearch from "./pages/AdvancedSearch";
import Statistics from "./pages/Statistics";
import JuanaChat from "./components/JuanaChat";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">
        <RequireAuth><Dashboard /></RequireAuth>
      </Route>
      <Route path="/subscriptions">
        <RequireAuth><Subscriptions /></RequireAuth>
      </Route>
      <Route path="/admin">
        <RequireAuth><Admin /></RequireAuth>
      </Route>
      <Route path="/email-preferences">
        <RequireAuth><EmailPreferences /></RequireAuth>
      </Route>
      <Route path="/calls" component={Calls} />
      <Route path="/calls/:id" component={CallDetail} />
      <Route path="/advanced-search">
        <RequireAuth><AdvancedSearch /></RequireAuth>
      </Route>
      <Route path="/statistics">
        <RequireAuth><Statistics /></RequireAuth>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <JuanaChat />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
