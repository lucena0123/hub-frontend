'use client';

import { useEffect, useState } from 'react';
import { getAlerts } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AlertBadgeProps {
  className?: string;
}

export function AlertBadge({ className }: AlertBadgeProps) {
  const [total, setTotal] = useState<number | null>(null);
  const [critical, setCritical] = useState(0);

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      try {
        const data = await getAlerts();
        if (!active) return;
        setTotal(data.total);
        setCritical(data.critical);
      } catch {
        if (!active) return;
        setTotal(0);
        setCritical(0);
      }
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (!total) return null;

  const hasCritical = critical > 0;

  return (
    <Badge
      className={cn(
        'ml-2 px-2 py-0.5 text-xs',
        hasCritical ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-950',
        className
      )}
      title={`${total} alertas ativos`}
    >
      {total}
    </Badge>
  );
}
