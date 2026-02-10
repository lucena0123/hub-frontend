'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, PlayCircle, Bell, LogOut, Settings, Sparkles, BarChart3, Kanban } from 'lucide-react';
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
    <nav className="border-b border-primary/20 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-black text-2xl italic tracking-tighter hover:text-primary transition-colors flex items-center gap-2 group">
              <span className="text-primary group-hover:animate-pulse">{'>'}</span> Hub
            </Link>
            <div className="flex gap-1 overflow-x-auto no-scrollbar mask-horizontal-fade">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-mono tracking-wider transition-all relative overflow-hidden group',
                      isActive
                        ? 'text-primary bg-primary/10 border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    {isActive && <div className="absolute inset-0 bg-primary/5 animate-pulse" />}
                    <Icon className={cn("h-3 w-3", isActive && "text-primary shadow-[0_0_5px_var(--color-primary)]")} />
                    <span>{item.label}</span>
                    {item.showBadge && <AlertBadge />}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 border-l border-border/50 pl-4">
            <NotificationBell />
            {user && (
              <>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors group"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 border border-primary/30 group-hover:border-primary transition-colors">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full border border-background" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-[10px] uppercase tracking-widest opacity-50">OPERATOR</span>
                    <span className="font-bold">{user.name}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
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
