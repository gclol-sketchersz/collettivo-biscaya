import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
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
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/admin" component={Admin} />
      <Route path="/email-preferences" component={EmailPreferences} />
      <Route path="/calls" component={Calls} />
      <Route path="/calls/:id" component={CallDetail} />
      <Route path="/advanced-search" component={AdvancedSearch} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

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
