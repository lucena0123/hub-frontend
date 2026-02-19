'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, PlayCircle, Bell, LogOut, Sparkles, BarChart3, Kanban, ClipboardCheck } from 'lucide-react';
import { AlertBadge } from '@/components/alerts/alert-badge';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/summary',
    label: 'Resumo',
    icon: BarChart3,
  },
  {
    href: '/meta-ops',
    label: 'Meta Ops',
    icon: ClipboardCheck,
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: Users,
  },
  {
    href: '/processes',
    label: 'Processos',
    icon: PlayCircle,
  },
  {
    href: '/tasks',
    label: 'Intervention',
    icon: LayoutDashboard,
  },
  {
    href: '/executive',
    label: 'Executivo',
    icon: BarChart3,
  },
  {
    href: '/creative-linter',
    label: 'Linter',
    icon: Sparkles,
  },
  {
    href: '/optimization/board',
    label: 'Kanban',
    icon: Kanban,
  },
  {
    href: '/comercial',
    label: 'Comercial',
    icon: Users,
  },
  {
    href: '/alerts',
    label: 'Alertas',
    icon: Bell,
    showBadge: true,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="premium-nav">
      <div className="premium-nav-inner">
        <div className="premium-nav-grid">
          <Link href="/" className="premium-nav-brand">
            <span className="premium-nav-kicker">Agency Console</span>
            <span className="premium-nav-title">
              Hub<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="premium-nav-links no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "premium-nav-link",
                    isActive && "premium-nav-link-active"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  {item.showBadge && <AlertBadge />}
                </Link>
              );
            })}
          </div>

          <div className="premium-nav-user">
            <NotificationBell />
            {user && (
              <>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-primary/40">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full border border-background" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operador</span>
                    <span className="font-semibold">{user.name}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[2px] transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
