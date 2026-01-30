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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon-sm">
              <Link href={`/clients/${clientId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground">Monthly performance snapshots</p>
            </div>
          </div>
          <Button onClick={() => setOpenGenerator(true)}>
            Generate new report
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading reports...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No reports generated yet.</p>
              <Button className="mt-4" onClick={() => setOpenGenerator(true)}>
                Generate first report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reportCards.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Period</span>
                    <span>{report.period}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Generated</span>
                    <span>{report.generatedAt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize">{report.status}</span>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <a href={report.downloadUrl} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
    </div>
  );
}
