'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, PlayCircle, Bell } from 'lucide-react';
import { AlertBadge } from '@/components/alerts/alert-badge';
import { NotificationBell } from '@/components/notifications/notification-bell';

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
    href: '/alerts',
    label: 'Alertas',
    icon: Bell,
    showBadge: true,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl">
              Hub
            </Link>
            <div className="flex gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.showBadge && <AlertBadge />}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm text-muted-foreground">v1.0.0</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
