import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, Weight, Package, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface HistoricoData {
  id: string;
  date: string;
  time: string;
  team: string;
  items: number;
  totalWeight: number;
}

interface TeamRanking {
  name: string;
  sessions: number;
  items: number;
  totalWeight: number;
  points: number;
  trending: boolean;
}

const POINTS_PER_KG = 3;

const getMedal = (index: number) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}`;
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toLocaleString("pt-BR");
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const parseBrazilianDate = (date: string) => {
  const [day, month, year] = date.split("/").map(Number);

  return {
    day,
    month,
    year,
    monthIndex: month - 1,
  };
};

const Ranking = () => {
  const [historico, setHistorico] = useState<HistoricoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchRankingData = async () => {
    try {
      const response = await api.get("/api/historico");

      const formattedData: HistoricoData[] = response.data.map((item: any) => ({
        id: item.id,
        date: item.date,
        time: item.time,
        team: item.team || "Sem grupo",
        items: Number(item.items) || 0,
        totalWeight: Number(item.totalWeight) || 0,
      }));

      setHistorico(formattedData);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingData();

    const interval = setInterval(() => {
      fetchRankingData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const teams = useMemo<TeamRanking[]>(() => {
    const teamsMap: Record<string, TeamRanking> = {};

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    historico.forEach((item) => {
      const teamName = item.team || "Sem grupo";

      if (!teamsMap[teamName]) {
        teamsMap[teamName] = {
          name: teamName,
          sessions: 0,
          items: 0,
          totalWeight: 0,
          points: 0,
          trending: false,
        };
      }

      teamsMap[teamName].sessions += 1;
      teamsMap[teamName].items += Number(item.items) || 0;
      teamsMap[teamName].totalWeight += Number(item.totalWeight) || 0;

      if (item.date) {
        const { monthIndex, year } = parseBrazilianDate(item.date);

        if (monthIndex === currentMonth && year === currentYear) {
          teamsMap[teamName].trending = true;
        }
      }
    });

    return Object.values(teamsMap)
      .map((team) => ({
        ...team,
        points: team.totalWeight * POINTS_PER_KG,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight;
        return b.items - a.items;
      });
  }, [historico]);

  const leader = teams[0];

  const totalPoints = useMemo(() => {
    return teams.reduce((sum, team) => sum + team.points, 0);
  }, [teams]);

  const totalWeight = useMemo(() => {
    return teams.reduce((sum, team) => sum + team.totalWeight, 0);
  }, [teams]);

  const totalItems = useMemo(() => {
    return teams.reduce((sum, team) => sum + team.items, 0);
  }, [teams]);

  const averagePoints = useMemo(() => {
    if (teams.length === 0) return 0;
    return totalPoints / teams.length;
  }, [teams.length, totalPoints]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Placar de Equipes
        </h1>

        <p className="text-muted-foreground text-sm">
          Ranking real de contribuições por equipe
        </p>

        {lastUpdate && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>Atualizado automaticamente às {lastUpdate}</span>
          </div>
        )}
      </div>

      <Card className="bg-secondary">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Equipe Líder
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando ranking...
            </p>
          ) : !leader ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma equipe possui doações registradas ainda.
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                <Trophy className="h-8 w-8 text-primary" />

                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  #1
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {leader.name}
                </h2>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                  <span>
                    <strong className="text-foreground">
                      {formatNumber(leader.points)}
                    </strong>{" "}
                    Pontos
                  </span>

                  <span>
                    <strong className="text-foreground">
                      {leader.totalWeight.toFixed(2)}
                    </strong>{" "}
                    kg
                  </span>

                  <span>
                    <strong className="text-foreground">{leader.items}</strong>{" "}
                    Itens
                  </span>

                  <span>
                    <strong className="text-foreground">
                      {leader.sessions}
                    </strong>{" "}
                    Sessões
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Ranking Completo
          </h3>

          <p className="text-xs text-muted-foreground mb-4">
            Classificação geral das equipes com base nas doações registradas
          </p>

          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-center text-muted-foreground py-4">
                Carregando equipes...
              </p>
            ) : teams.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">
                Nenhuma doação registrada para montar o ranking.
              </p>
            ) : (
              teams.map((team, index) => (
                <div
                  key={team.name}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm">
                      {getMedal(index)}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {team.name}
                        </span>

                        {team.trending && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-primary text-primary"
                          >
                            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                            Ativo no mês
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {team.sessions} sessões · {team.items} itens ·{" "}
                        {team.totalWeight.toFixed(2)} kg
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatNumber(team.points)}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      pontos
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">
              Total de Equipes
            </span>

            <p className="text-3xl font-bold text-foreground mt-1">
              {loading ? "..." : teams.length}
            </p>

            <p className="text-xs text-muted-foreground">
              equipes com doações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">
              Total de Pontos
            </span>

            <p className="text-3xl font-bold text-foreground mt-1">
              {loading ? "..." : formatNumber(totalPoints)}
            </p>

            <p className="text-xs text-muted-foreground">
              {totalWeight.toFixed(2)} kg arrecadados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">
              Média de Pontos
            </span>

            <p className="text-3xl font-bold text-foreground mt-1">
              {loading ? "..." : formatNumber(averagePoints)}
            </p>

            <p className="text-xs text-muted-foreground">
              por equipe participante
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Weight className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Critério de pontuação
                </p>

                <p className="text-base font-semibold text-foreground">
                  1 kg doado = {POINTS_PER_KG} pontos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Total de itens registrados
                </p>

                <p className="text-base font-semibold text-foreground">
                  {loading ? "..." : totalItems} itens
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ranking;