import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Utensils,
  TrendingUp,
  Calendar,
  CheckCircle,
  Weight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

interface SessionData {
  id: string;
  date: string;
  time: string;
  team: string;
  items: number;
  totalWeight: number;
}

interface ChartData {
  month: string;
  items: number;
  weight: number;
}

const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const parseBrazilianDate = (date: string) => {
  const [day, month, year] = date.split("/").map(Number);

  return {
    day,
    month,
    year,
    monthIndex: month - 1,
  };
};

const Dashboard = () => {
  const [userName, setUserName] = useState("Carregando...");
  const [userRole, setUserRole] = useState("");
  const [recentActivity, setRecentActivity] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/api/historico");

      const formattedData: SessionData[] = response.data.map((item: any) => ({
        id: item.id,
        date: item.date,
        time: item.time,
        team: item.team,
        items: Number(item.items) || 0,
        totalWeight: Number(item.totalWeight) || 0,
      }));

      setRecentActivity(formattedData);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("liderai_user");

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const firstName = parsedUser.name.split(" ")[0];

      setUserName(firstName);
      setUserRole(parsedUser.role === "admin" ? "Administrador" : "Aluno");
    }

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const totalItems = useMemo(() => {
    return recentActivity.reduce((total, item) => total + Number(item.items), 0);
  }, [recentActivity]);

  const totalWeight = useMemo(() => {
    return recentActivity.reduce(
      (total, item) => total + Number(item.totalWeight),
      0
    );
  }, [recentActivity]);

  const estimatedMeals = useMemo(() => {
    return Math.floor(totalWeight / 0.4);
  }, [totalWeight]);

  const chartData = useMemo(() => {
    const groupedData: Record<string, ChartData & { sortKey: number }> = {};

    recentActivity.forEach((item) => {
      if (!item.date) return;

      const { monthIndex, year } = parseBrazilianDate(item.date);
      const key = `${year}-${monthIndex}`;
      const label = `${monthNames[monthIndex]}/${String(year).slice(-2)}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          month: label,
          items: 0,
          weight: 0,
          sortKey: year * 100 + monthIndex,
        };
      }

      groupedData[key].items += Number(item.items) || 0;
      groupedData[key].weight += Number(item.totalWeight) || 0;
    });

    return Object.values(groupedData)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...data }) => data);
  }, [recentActivity]);

  const currentMonthItems = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return recentActivity.reduce((total, item) => {
      if (!item.date) return total;

      const { monthIndex, year } = parseBrazilianDate(item.date);

      if (monthIndex === currentMonth && year === currentYear) {
        return total + Number(item.items);
      }

      return total;
    }, 0);
  }, [recentActivity]);

  const currentMonthWeight = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return recentActivity.reduce((total, item) => {
      if (!item.date) return total;

      const { monthIndex, year } = parseBrazilianDate(item.date);

      if (monthIndex === currentMonth && year === currentYear) {
        return total + Number(item.totalWeight);
      }

      return total;
    }, 0);
  }, [recentActivity]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Visão geral da arrecadação de alimentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Total Arrecadado
              </span>
              <Package className="h-4 w-4 text-primary" />
            </div>

            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : totalItems}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              itens arrecadados
            </p>

            <div className="flex items-center gap-1 mt-2">
              <Weight className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">
                {totalWeight.toFixed(2)} kg no total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Refeições Geradas
              </span>
              <Utensils className="h-4 w-4 text-primary" />
            </div>

            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : estimatedMeals}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              refeições estimadas
            </p>

            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">
                {currentMonthWeight.toFixed(2)} kg este mês
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Ação Rápida
              </span>
            </div>

            <Button className="w-full rounded-lg h-11" size="lg">
              Começar Nova Contagem
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-2">
              Inicie uma nova sessão de identificação
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Fluxo Total de Doações
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Acompanhamento de itens arrecadados por mês
          </p>

          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma doação registrada para exibir no gráfico.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="greenGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#00ab72" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ab72" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(150 15% 90%)"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(192 10% 46%)" }}
                  />

                  <YAxis tick={{ fontSize: 12, fill: "hsl(192 10% 46%)" }} />

                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "items") return [`${value} itens`, "Itens"];
                      if (name === "weight") return [`${value} kg`, "Peso"];
                      return [value, name];
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="items"
                    stroke="#00ab72"
                    strokeWidth={2}
                    fill="url(#greenGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary font-medium">
              {currentMonthItems} itens registrados este mês
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Atividade Recente
          </h3>

          <p className="text-xs text-muted-foreground mb-4">
            Últimas sessões de contagem realizadas
          </p>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">
                Nenhuma atividade registrada.
              </p>
            ) : (
              recentActivity.slice(0, 4).map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.team}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.date} às {item.time}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">
                      {item.items} itens
                    </p>

                    <p className="text-xs font-medium text-muted-foreground flex items-center justify-end gap-1">
                      <Weight className="h-3 w-3" />
                      {Number(item.totalWeight).toFixed(2)} kg
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button variant="outline" className="w-full mt-4 rounded-lg">
            Ver Histórico Completo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;