'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCheck, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from '@/lib/api/client/notifications';

interface NotificationListProps {
  onRead?: () => void;
}

const severityIcon = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const severityDot = {
  critical: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-primary',
};

export function NotificationList({ onRead }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listNotifications({ limit: 20 });
      setNotifications(data.notifications);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      await refresh();
      onRead?.();
    } catch {
      // silently ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await refresh();
      onRead?.();
    } catch {
      // silently ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col max-h-[420px]">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/60">
        <h3 className="font-semibold text-sm">Notificações</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma notificação</p>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = severityIcon[notification.severity] || Info;
              const dot = severityDot[notification.severity] || 'bg-slate-400';

              return (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-accent/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                      notification.severity === 'critical' ? 'text-rose-500' :
                      notification.severity === 'warning' ? 'text-amber-500' : 'text-primary'
                    }`} />

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        {!notification.read && (
                          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>

                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
                        title="Marcar como lida"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
