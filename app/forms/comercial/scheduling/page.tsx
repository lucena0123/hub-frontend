'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CalendarCheck2, Loader2, RefreshCw, XCircle } from 'lucide-react';

type ScheduleSlot = {
  start: string;
  end: string;
  label?: string;
  slotStart?: string;
  slotEnd?: string;
  quickToken?: string;
  quickLink?: string;
};

type SlotsResponse = {
  leadId: string;
  slots: ScheduleSlot[];
  suggestedSlots?: ScheduleSlot[];
  calendarUrl?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function formatSlotRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })} • ${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function slotStart(slot: ScheduleSlot): string {
  return slot.slotStart || slot.start;
}

function slotEnd(slot: ScheduleSlot): string {
  return slot.slotEnd || slot.end;
}

export default function ComercialSchedulingPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const leadId = searchParams.get('leadId') || '';
  const queryQuickToken = searchParams.get('quickToken') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [suggestedSlots, setSuggestedSlots] = useState<ScheduleSlot[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [scheduledRange, setScheduledRange] = useState<{ start: string; end: string } | null>(null);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    [],
  );

  const loadSlots = useCallback(async () => {
    if (!token || !leadId) {
      setError('Link inválido. Solicite um novo convite de agendamento.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/public/comercial/scheduling/slots?token=${encodeURIComponent(token)}&leadId=${encodeURIComponent(leadId)}&timezone=${encodeURIComponent(timezone)}`;
      const response = await fetch(url);
      const data = (await response.json()) as SlotsResponse & { message?: string };
      if (!response.ok) {
        throw new Error(data.message || 'Não foi possível carregar horários disponíveis.');
      }

      setSlots(data.slots || []);
      setSuggestedSlots(data.suggestedSlots || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Erro inesperado ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }, [leadId, timezone, token]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const confirmCalendarSlot = useCallback(
    async (start: string, end: string) => {
      setSubmitting(true);
      setError(null);
      setConflictWarning(null);
      try {
        const url = eventId
          ? `${API_BASE}/api/public/comercial/scheduling/update`
          : `${API_BASE}/api/public/comercial/scheduling/confirm`;
        const payload: Record<string, unknown> = {
          token,
          leadId,
          slotStart: start,
          slotEnd: end,
          timezone,
        };
        if (eventId) payload.eventId = eventId;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { eventId?: string; message?: string };
        if (!response.ok) {
          throw new Error(data.message || 'Falha ao confirmar horário.');
        }

        if (data.eventId) {
          setEventId(data.eventId);
        }
        setScheduledRange({ start, end });
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Erro ao confirmar horário.');
      } finally {
        setSubmitting(false);
      }
    },
    [eventId, leadId, timezone, token],
  );

  const quickConfirm = useCallback(
    async (quickToken: string) => {
      setSubmitting(true);
      setError(null);
      setConflictWarning(null);
      try {
        const response = await fetch(`${API_BASE}/api/public/comercial/scheduling/quick-confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, quickToken }),
        });
        const data = (await response.json()) as { eventId?: string; slotStart?: string; slotEnd?: string; message?: string };
        if (!response.ok) {
          if (response.status === 409) {
            setConflictWarning(data.message || 'Esse horário já foi ocupado. Escolha outro horário no calendário abaixo.');
            await loadSlots();
            return;
          }
          throw new Error(data.message || 'Falha na confirmação rápida.');
        }

        if (data.eventId) setEventId(data.eventId);
        if (data.slotStart && data.slotEnd) {
          setScheduledRange({ start: data.slotStart, end: data.slotEnd });
        }
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Erro ao confirmar horário rápido.');
      } finally {
        setSubmitting(false);
      }
    },
    [leadId, loadSlots],
  );

  const cancelMeeting = useCallback(async () => {
    if (!eventId) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/public/comercial/scheduling/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, leadId, eventId, cancelledBy: 'lead_public_page' }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao cancelar reunião.');
      }
      setEventId(null);
      setScheduledRange(null);
      await loadSlots();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro ao cancelar reunião.');
    } finally {
      setSubmitting(false);
    }
  }, [eventId, leadId, loadSlots, token]);

  const runQueryQuickConfirm = useCallback(async () => {
    if (!queryQuickToken || scheduledRange) return;
    await quickConfirm(queryQuickToken);
  }, [queryQuickToken, quickConfirm, scheduledRange]);

  useEffect(() => {
    void runQueryQuickConfirm();
  }, [runQueryQuickConfirm]);

  const hasQuickSuggestions = suggestedSlots.some((slot) => Boolean(slot.quickToken));
  const introCopy = hasQuickSuggestions
    ? 'Você pode confirmar um horário sugerido com 1 clique ou selecionar outro horário no calendário completo.'
    : 'Escolha um horário sugerido ou selecione outro horário no calendário completo.';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Agendamento de Diagnóstico</p>
            <h1 className="text-2xl font-semibold text-zinc-900">Escolha seu horário</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {introCopy}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSlots()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar horários
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {conflictWarning && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{conflictWarning}</span>
          </div>
        )}

        {scheduledRange && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CalendarCheck2 className="h-4 w-4" />
                  Reunião confirmada
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  {formatSlotRange(scheduledRange.start, scheduledRange.end)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void cancelMeeting()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Horários Sugeridos</h2>
          {suggestedSlots.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              No momento não há sugestões rápidas. Use o calendário completo abaixo.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {suggestedSlots.map((slot) => {
                const start = slotStart(slot);
                const end = slotEnd(slot);
                const key = `${start}_${end}_${slot.quickToken || 'calendar'}`;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      if (slot.quickToken) {
                        void quickConfirm(slot.quickToken);
                        return;
                      }
                      void confirmCalendarSlot(start, end);
                    }}
                    className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-800 hover:border-zinc-500 hover:bg-white disabled:opacity-60"
                  >
                    <p className="font-medium">{slot.label || formatSlotRange(start, end)}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {slot.quickToken ? 'Confirmar com 1 clique' : 'Confirmar no calendário'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Calendário Completo</h2>
          {slots.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Sem slots disponíveis agora. Tente atualizar em alguns minutos.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {slots.map((slot) => {
                const start = slotStart(slot);
                const end = slotEnd(slot);
                return (
                  <button
                    type="button"
                    key={`${start}_${end}`}
                    disabled={submitting}
                    onClick={() => void confirmCalendarSlot(start, end)}
                    className="rounded-lg border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    {slot.label || formatSlotRange(start, end)}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
