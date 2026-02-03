'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { generateReport, generateWeeklyReport, getReportDownloadUrl } from '@/lib/api/client';
import type { MonthlyReport } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReportGeneratorProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  onGenerated?: (report: MonthlyReport) => void;
}

const monthOptions = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function ReportGenerator({ open, onClose, clientId, clientName, onGenerated }: ReportGeneratorProps) {
  const today = new Date();
  const toIsoDateUtc = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const shiftUtcDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  };

  const [reportType, setReportType] = useState<'monthly' | 'weekly'>('monthly');
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [startDate, setStartDate] = useState(() => toIsoDateUtc(shiftUtcDays(today, -6)));
  const [endDate, setEndDate] = useState(() => toIsoDateUtc(today));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<MonthlyReport | null>(null);

  const selectedMonthLabel = useMemo(() => {
    return monthOptions.find((option) => option.value === month)?.label ?? 'Month';
  }, [month]);

  if (!open) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const report =
        reportType === 'weekly'
          ? await generateWeeklyReport(clientId, { startDate, endDate })
          : await generateReport(clientId, {
              month: Number(month),
              year: Number(year),
            });
      setSuccessReport(report);
      onGenerated?.(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadUrl = successReport ? getReportDownloadUrl(successReport.id) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate report
            </CardTitle>
            <p className="text-sm text-muted-foreground">{clientName ?? clientId}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as 'monthly' | 'weekly')}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'monthly' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  min={2020}
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Preview</p>
            <p className="mt-2">
              {reportType === 'weekly'
                ? `Report for ${startDate} to ${endDate}.`
                : `Report for ${selectedMonthLabel} ${year}.`}{' '}
              The report will include performance KPIs, campaign breakdown, and BPMN progress snapshot.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {successReport && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <p className="font-semibold">Report generated successfully.</p>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Close
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
