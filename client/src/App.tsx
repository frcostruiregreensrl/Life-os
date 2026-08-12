import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Companion } from "@/components/Companion";
import { useAutoTheme } from "@/lib/useAutoTheme";
import { Placeholder } from "@/pages/Placeholder";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Todos from "@/pages/Todos";
import Habits from "@/pages/Habits";
import More from "@/pages/More";
import NotFound from "@/pages/NotFound";

// caricata a parte: trascina con sé la libreria di riconoscimento volto (~600kB),
// che deve pesare solo su chi visita davvero questa pagina
const AvatarSettings = lazy(() => import("@/pages/AvatarSettings"));

const COMPANION_EXCLUDED_PATHS = ["/onboarding", "/register", "/todos"];

function GlobalCompanion() {
  const [location] = useLocation();
  if (COMPANION_EXCLUDED_PATHS.includes(location)) return null;
  return <Companion />;
}

function ThemeManager() {
  useAutoTheme();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeManager />
        <GlobalCompanion />
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/todos">
            <ProtectedRoute>
              <Todos />
            </ProtectedRoute>
          </Route>
          <Route path="/habits">
            <ProtectedRoute>
              <Habits />
            </ProtectedRoute>
          </Route>
          <Route path="/more">
            <ProtectedRoute>
              <More />
            </ProtectedRoute>
          </Route>
          <Route path="/avatar">
            <ProtectedRoute>
              <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Caricamento...</div>}>
                <AvatarSettings />
              </Suspense>
            </ProtectedRoute>
          </Route>
          <Route path="/dieta">
            <ProtectedRoute>
              <Placeholder title="Dieta" description="Diario pasti, target calorie/macro, acqua, dispensa e lista della spesa." />
            </ProtectedRoute>
          </Route>
          <Route path="/salute">
            <ProtectedRoute>
              <Placeholder title="Salute" description="Sonno e ciclo mestruale." />
            </ProtectedRoute>
          </Route>
          <Route path="/agenda">
            <ProtectedRoute>
              <Placeholder title="Agenda intelligente" description="Suggerimenti, reminder meteo/posizione, luoghi ed esportazione calendario." />
            </ProtectedRoute>
          </Route>
          <Route path="/spese">
            <ProtectedRoute>
              <Placeholder title="Spese e risparmi" description="Registrazione spese, categorie e salvadanaio virtuale." />
            </ProtectedRoute>
          </Route>
          <Route path="/riepiloghi">
            <ProtectedRoute>
              <Placeholder title="Riepiloghi" description="Riepiloghi settimanali e mensili dei tuoi progressi." />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
