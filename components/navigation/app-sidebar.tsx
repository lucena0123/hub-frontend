'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  ClipboardCheck,
  Users,
  PlayCircle,
  Kanban,
  Settings2,
  TrendingUp,
  UserPlus,
  Sparkles,
  Bell,
  Wrench,
  BarChart2,
  FileText,
  Wallet,
  FolderKanban,
  HeartPulse,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { AlertBadge } from '@/components/alerts/alert-badge';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  showBadge?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operações',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/summary', label: 'Resumo', icon: BarChart3 },
      { href: '/meta-ops', label: 'Meta Ops', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/clients', label: 'Contas', icon: Users },
      { href: '/processes', label: 'Processos', icon: PlayCircle },
    ],
  },
  {
    label: 'Otimização',
    items: [
      { href: '/optimization/board', label: 'Kanban Board', icon: Kanban },
      { href: '/optimization/settings', label: 'Configurações', icon: Settings2 },
      { href: '/optimization/effectiveness', label: 'Efetividade', icon: TrendingUp },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/comercial', label: 'Pipeline de Leads', icon: UserPlus },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/finance/contracts', label: 'Financeiro', icon: Wallet },
      { href: '/projects', label: 'Projetos', icon: FolderKanban },
      { href: '/cs/portfolio', label: 'Customer Success', icon: HeartPulse },
    ],
  },
  {
    label: 'Diagnóstico',
    items: [
      { href: '/creative-linter', label: 'Creative Linter', icon: Sparkles },
      { href: '/alerts', label: 'Alertas', icon: Bell, showBadge: true },
      { href: '/tasks', label: 'Intervenções', icon: Wrench },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { href: '/executive', label: 'Executivo', icon: BarChart2 },
      { href: '/performance', label: 'Performance', icon: FileText },
    ],
  },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function NavGroupSection({ group, pathname, collapsed }: { group: NavGroup; pathname: string; collapsed: boolean }) {
  const hasActive = group.items.some((item) => isItemActive(pathname, item.href));
  const [open, setOpen] = useState(true);

  return (
    <div className="sidebar-group">
      {!collapsed && (
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="sidebar-group-label"
          aria-expanded={open}
        >
          <span>{group.label}</span>
          <ChevronDown
            className={cn('h-3 w-3 transition-transform duration-200', !open && '-rotate-90')}
          />
        </button>
      )}
      {(open || collapsed) && (
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('sidebar-nav-link', active && 'sidebar-nav-link-active')}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="sidebar-nav-icon" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.showBadge && <AlertBadge />}
                  </>
                )}
                {collapsed && item.showBadge && (
                  <span className="absolute top-1 right-1">
                    <AlertBadge />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#050505]/90 text-gray-400 backdrop-blur-sm transition-colors hover:text-white lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Sidebar panel */}
      <aside
        className={cn(
          'sidebar-panel',
          collapsed ? 'sidebar-panel-collapsed' : 'sidebar-panel-expanded',
          mobileOpen ? 'sidebar-panel-mobile-open' : 'sidebar-panel-mobile-closed'
        )}
        aria-label="Navegação principal"
      >
        {/* Header */}
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand" onClick={() => setMobileOpen(false)}>
            <span className="sidebar-brand-kicker">Agency Console</span>
            {!collapsed && (
              <span className="sidebar-brand-title">
                Hub<span className="text-primary">.</span>
              </span>
            )}
          </Link>
          <div className="flex items-center gap-1">
            {/* Collapse toggle — desktop only */}
            <button
              type="button"
              onClick={() => setCollapsed((p) => !p)}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/6 hover:text-white"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              <Menu className="h-3.5 w-3.5" />
            </button>
            {/* Mobile close */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/6 hover:text-white lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="sidebar-nav" aria-label="Menu principal">
          {NAV_GROUPS.map((group) => (
            <NavGroupSection
              key={group.label}
              group={group}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Footer: notifications + user */}
        <div className="sidebar-footer">
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center flex-col')}>
            <NotificationBell />
          </div>

          {user && (
            <div className={cn('sidebar-user', collapsed && 'sidebar-user-collapsed')}>
              <Link
                href="/settings"
                className="sidebar-user-info"
                title={collapsed ? user.name : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 border border-primary/30">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-[#050505]" />
                </div>
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-gray-500">Operador</span>
                    <span className="text-xs font-medium text-gray-200 truncate">{user.name}</span>
                  </div>
                )}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="sidebar-logout-btn"
                aria-label="Sair da conta"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
