export const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
};

export const formatCreativeType = (value: string | null | undefined, isDynamic: boolean) => {
  if (isDynamic) return 'dynamic';
  if (!value) return null;
  return value.replace(/_/g, ' ').toLowerCase();
};

export function rateColor(rate: number, type: 'hook' | 'hold'): string {
  if (type === 'hook') {
    if (rate >= 30) return 'text-emerald-600 font-medium';
    if (rate >= 15) return 'text-yellow-600';
    return 'text-rose-600';
  }

  if (rate >= 50) return 'text-emerald-600 font-medium';
  if (rate >= 25) return 'text-yellow-600';
  return 'text-rose-600';
}

