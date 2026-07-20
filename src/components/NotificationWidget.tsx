'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, Users, ShoppingBag, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  link: string;
  createdAt: string;
}

export default function NotificationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notificaciones');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notificaciones || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0); // Optimistic UI
      try {
        await fetch('/api/notificaciones', { method: 'PATCH' });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'PRODUCTO': return <Package className="w-5 h-5 text-indigo-500" />;
      case 'CLIENTE': return <Users className="w-5 h-5 text-blue-500" />;
      case 'VENTA': return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      case 'EVENTO': return <CalendarIcon className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-violet-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-xl border border-zinc-200 dark:border-white/10 p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
        title="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0c0c14] animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] flex flex-col rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a1a24] shadow-2xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] px-4 py-3">
            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-500" />
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Marcadas como leídas
              </span>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-20" />
                <p className="text-sm">No tienes notificaciones recientes.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-white/5">
                {notifications.map((notif) => (
                  <Link 
                    key={notif.id} 
                    href={notif.link}
                    onClick={() => setIsOpen(false)}
                    className="flex gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                        {getIcon(notif.tipo)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {notif.titulo}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                        {notif.mensaje}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 font-medium">
                        {getTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
