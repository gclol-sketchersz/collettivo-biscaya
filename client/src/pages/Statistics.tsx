import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { trpc } from "@/lib/trpc";

export default function Statistics() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Mock data for demonstration
  const viewsData = [
    { name: "Lunedì", views: 45, saves: 12, clicks: 8 },
    { name: "Martedì", views: 52, saves: 15, clicks: 10 },
    { name: "Mercoledì", views: 48, saves: 14, clicks: 9 },
    { name: "Giovedì", views: 61, saves: 18, clicks: 12 },
    { name: "Venerdì", views: 55, saves: 16, clicks: 11 },
    { name: "Sabato", views: 38, saves: 10, clicks: 6 },
    { name: "Domenica", views: 42, saves: 11, clicks: 7 },
  ];

  const callTypeData = [
    { name: "Mostre", value: 35 },
    { name: "Residenze", value: 28 },
    { name: "Concorsi", value: 22 },
    { name: "Grant", value: 15 },
  ];

  const COLORS = ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981"];

  const conversionData = [
    { name: "Casasanvito", views: 120, conversions: 18, rate: 15 },
    { name: "MYllennium Award", views: 95, conversions: 14, rate: 14.7 },
    { name: "Étant donnés", views: 110, conversions: 22, rate: 20 },
    { name: "Fondazione CRT", views: 85, conversions: 12, rate: 14.1 },
    { name: "Orizzonti L.I.V.E.", views: 70, conversions: 10, rate: 14.3 },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Effettua il login per visualizzare le statistiche</p>
          <Button onClick={() => navigate("/")}>Torna alla Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Statistiche Piattaforma</h1>
            <p className="text-gray-600">Analizza l'andamento dei bandi e le interazioni degli utenti</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Visualizzazioni Totali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">1,247</div>
              <p className="text-xs text-gray-500 mt-1">+12% rispetto alla scorsa settimana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Candidature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">187</div>
              <p className="text-xs text-gray-500 mt-1">+8% rispetto alla scorsa settimana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tasso di Conversione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">15.0%</div>
              <p className="text-xs text-gray-500 mt-1">Media piattaforma</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bandi Attivi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">10</div>
              <p className="text-xs text-gray-500 mt-1">Nel database</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views & Interactions Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Visualizzazioni e Interazioni Settimanali</CardTitle>
              <CardDescription>Trend di visualizzazioni, salvataggi e click</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#0ea5e9" name="Visualizzazioni" />
                  <Line type="monotone" dataKey="saves" stroke="#06b6d4" name="Salvataggi" />
                  <Line type="monotone" dataKey="clicks" stroke="#14b8a6" name="Click Link" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Call Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione per Tipologia</CardTitle>
              <CardDescription>Visualizzazioni per tipo di bando</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={callTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {callTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Rate by Call */}
        <Card>
          <CardHeader>
            <CardTitle>Tasso di Conversione per Bando</CardTitle>
            <CardDescription>Visualizzazioni vs candidature per ogni bando</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" label={{ value: 'Visualizzazioni', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Tasso %', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="views" fill="#0ea5e9" name="Visualizzazioni" />
                <Bar yAxisId="left" dataKey="conversions" fill="#06b6d4" name="Candidature" />
                <Bar yAxisId="right" dataKey="rate" fill="#fbbf24" name="Tasso %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
