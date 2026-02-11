'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { getReportDownloadUrl, getReportsHistory } from '@/lib/api/client';
import type { MonthlyReport } from '@/types';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { format } from 'date-fns';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'MMM dd, yyyy');
};

export default function ClientReportsPage() {
  const params = useParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGenerator, setOpenGenerator] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        const data = await getReportsHistory(String(clientId));
        setReports(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [clientId]);

  const reportCards = useMemo(() => {
    return reports.map((report) => ({
      id: report.id,
      title: report.title,
      period: `${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`,
      generatedAt: formatDate(report.generatedAt),
      status: report.status,
      downloadUrl: getReportDownloadUrl(report.id),
    }));
  }, [reports]);

  return (
    <PageShell
      eyebrow={`Clientes / ${clientId ?? ''}`}
      title="Relatórios"
      description="Snapshots mensais para apresentação e auditoria."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {reports.length}</div>
        </div>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${clientId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button size="sm" onClick={() => setOpenGenerator(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar relatório
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <SectionHeader
          title="Histórico de Relatórios"
          subtitle="Snapshots mensais para auditoria e apresentação."
          icon={FileText}
        />

        <Reveal>
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Carregando relatórios...
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Nenhum relatório gerado ainda.</p>
                <Button className="mt-4" onClick={() => setOpenGenerator(true)}>
                  Gerar primeiro relatório
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)]">
              {reportCards.map((report, index) => (
                <Card key={report.id} className={index % 2 === 0 ? "lg:translate-x-4" : "lg:-translate-x-3"}>
                  <CardHeader>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Período</span>
                      <span>{report.period}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gerado</span>
                      <span>{report.generatedAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="capitalize">{report.status}</span>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <a href={report.downloadUrl} className="gap-2">
                        <Download className="h-4 w-4" />
                        Baixar PDF
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      {clientId && (
        <ReportGenerator
          open={openGenerator}
          onClose={() => setOpenGenerator(false)}
          clientId={String(clientId)}
          onGenerated={(report) => {
            setReports((prev) => [report, ...prev]);
            setOpenGenerator(false);
          }}
        />
      )}
    </PageShell>
  );
}
