import { useEffect, useState } from "react";
import {
  Calendar,
  Package,
  TrendingUp,
  Download,
  Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";

interface SessionData {
  id: string;
  date: string;
  time: string;
  team: string;
  items: number;
  totalWeight: number;
}

const Historico = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    const fetchHistorico = async () => {
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

        setSessions(formattedData);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      }
    };

    fetchHistorico();
  }, []);

  const totalItems = sessions.reduce((s, r) => s + Number(r.items), 0);
  const pesoGeral = sessions.reduce((s, r) => s + Number(r.totalWeight), 0);
  const mediaItems =
    sessions.length > 0 ? Math.round(totalItems / sessions.length) : 0;

  const exportarRelatorio = () => {
    if (sessions.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const dadosRelatorio = sessions.map((session) => ({
      "ID Sessão": session.id,
      Data: session.date,
      Hora: session.time,
      Equipe: session.team,
      "Itens Processados": session.items,
      "Peso Total (kg)": Number(session.totalWeight).toFixed(2),
      Status: "Concluída",
    }));

    const resumoRelatorio = [
      {
        Indicador: "Total de Sessões",
        Valor: sessions.length,
      },
      {
        Indicador: "Itens Processados",
        Valor: totalItems,
      },
      {
        Indicador: "Peso Geral Arrecadado (kg)",
        Valor: Number(pesoGeral).toFixed(2),
      },
      {
        Indicador: "Média de Itens por Sessão",
        Valor: mediaItems,
      },
    ];

    const workbook = XLSX.utils.book_new();

    const worksheetHistorico = XLSX.utils.json_to_sheet(dadosRelatorio);
    const worksheetResumo = XLSX.utils.json_to_sheet(resumoRelatorio);

    worksheetHistorico["!cols"] = [
      { wch: 25 },
      { wch: 14 },
      { wch: 10 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
    ];

    worksheetResumo["!cols"] = [{ wch: 30 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(workbook, worksheetResumo, "Resumo");
    XLSX.utils.book_append_sheet(workbook, worksheetHistorico, "Histórico");

    const dataAtual = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");

    XLSX.writeFile(workbook, `relatorio-liderai-${dataAtual}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Histórico de Sessões
          </h1>

          <p className="text-muted-foreground text-sm">
            Registro completo de todas as contagens realizadas
          </p>
        </div>

        <Button
          variant="outline"
          className="rounded-lg"
          onClick={exportarRelatorio}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">
                Total de Sessões
              </span>

              <p className="text-3xl font-bold text-foreground mt-1">
                {sessions.length}
              </p>

              <p className="text-xs text-muted-foreground">
                sessões registradas
              </p>
            </div>

            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">
                Itens Processados
              </span>

              <p className="text-3xl font-bold text-foreground mt-1">
                {totalItems}
              </p>

              <p className="text-xs text-muted-foreground">itens no total</p>
            </div>

            <Package className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">
                Média por Sessão
              </span>

              <p className="text-3xl font-bold text-foreground mt-1">
                {mediaItems}
              </p>

              <p className="text-xs text-muted-foreground">itens por sessão</p>
            </div>

            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Registro Detalhado
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">
                    ID Sessão
                  </th>

                  <th className="text-left py-3 px-2 font-semibold text-foreground">
                    Data & Hora
                  </th>

                  <th className="text-left py-3 px-2 font-semibold text-foreground">
                    Equipe
                  </th>

                  <th className="text-center py-3 px-2 font-semibold text-foreground">
                    Itens
                  </th>

                  <th className="text-left py-3 px-2 font-semibold text-foreground">
                    Peso Total
                  </th>

                  <th className="text-left py-3 px-2 font-semibold text-foreground">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhuma contagem registrada ainda. Passe alimentos na IA
                      para começar!
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/50"
                    >
                      <td className="py-3 px-2 font-medium text-foreground">
                        {s.id}
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />

                          <div>
                            <p className="text-foreground">{s.date}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.time}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-primary text-primary"
                        >
                          {s.team}
                        </Badge>
                      </td>

                      <td className="py-3 px-2 text-center font-semibold text-foreground">
                        {s.items}
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <Scale className="h-3.5 w-3.5 text-muted-foreground" />

                          <span className="text-foreground font-medium">
                            {Number(s.totalWeight).toFixed(2)} kg
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/10">
                          Concluída
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Historico;