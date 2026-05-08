import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);
}

interface CompareBannerProps {
  totalSpend: number;
  activeClients: number;
}

export function CompareBanner({ totalSpend, activeClients }: CompareBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#4F46E5] p-6 text-white col-span-2">
      {/* decorative circles */}
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/8 pointer-events-none" />
      <div className="absolute right-10 -bottom-10 h-24 w-24 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
          Portfólio
        </p>
        <h2 className="mb-1 text-[18px] font-extrabold">
          Performance do Mês
        </h2>
        <p className="mb-5 text-[13px] text-white/75">
          {formatCurrency(totalSpend)} investidos · {activeClients} clientes ativos
        </p>
        <Link
          href="/executive"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-slate-100"
        >
          Ver relatório
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
