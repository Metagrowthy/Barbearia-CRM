'use client';

import React from 'react';
import { Bell, Search, Filter, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface NotificationsViewProps {
  notifications: any[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsView({ 
  notifications, 
  onMarkRead, 
  onDelete,
  onClearAll 
}: NotificationsViewProps) {
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'stock' | 'system'>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return n.unread;
    if (filter === 'stock') return n.isStock;
    if (filter === 'system') return !n.isStock;
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 md:p-8 max-w-5xl mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Centro de Notificações <Bell size={24} className="text-primary" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Histórico completo de alertas, estoque e atividades do sistema.</p>
        </div>
        
        <button 
          onClick={onClearAll}
          className="flex items-center gap-2 px-4 py-2 border border-red-100 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
        >
          <Trash2 size={16} /> Limpar Tudo
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit mb-6 overflow-x-auto scrollbar-hide max-w-full">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'unread', label: 'Não Lidas' },
          { id: 'stock', label: 'Estoque' },
          { id: 'system', label: 'Sistema' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id as any)}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              filter === opt.id ? "bg-white text-primary shadow-md" : "text-gray-500 hover:text-gray-900"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((n) => (
              <motion.div 
                layout
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "p-6 bg-white border rounded-3xl flex items-start gap-5 group hover:shadow-xl hover:shadow-gray-100 transition-all",
                  n.unread ? "border-primary/20 shadow-lg shadow-primary/5" : "border-outline"
                )}
              >
                <div className={cn(
                  "p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-500",
                  n.isStock ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                )}>
                  {n.isStock ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h4 className="text-sm font-black text-gray-900 truncate">
                      {n.title}
                      {n.unread && <span className="ml-3 px-2 py-0.5 bg-primary text-white text-[8px] font-black rounded uppercase">Novo</span>}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-4">{n.message}</p>
                  
                  <div className="flex items-center gap-4">
                    {n.unread && (
                      <button 
                        onClick={() => onMarkRead(n.id)}
                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                      >
                        Marcar como lida
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(n.id)}
                      className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center glass-card border-dashed">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Bell size={32} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Nenhuma notificação encontrada</h3>
              <p className="text-xs text-gray-400 font-medium max-w-[260px]">Tudo limpo por aqui! Você não tem alertas pendentes neste filtro.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
