'use client';

import React from 'react';
import { UserPlus, ChevronRight, Mail, Phone, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface RecentClientsProps {
  onNewClient?: () => void;
  appointments?: any[];
}

export default function RecentClients({ onNewClient, appointments = [] }: RecentClientsProps) {
  // Extract unique clients from appointments and take latest 4
  const recentClients = React.useMemo(() => {
    const clientsMap: Record<string, any> = {};
    
    // Sort appointments by date desc to get newest first
    const sorted = [...appointments].sort((a, b) => {
      const dateA = new Date(a.fullDate || a.appointment_date || '');
      const dateB = new Date(b.fullDate || b.appointment_date || '');
      return dateB.getTime() - dateA.getTime();
    });

    sorted.forEach(apt => {
      const phone = apt.client_phone || 'sem-p';
      if (!clientsMap[phone] && Object.keys(clientsMap).length < 4) {
        clientsMap[phone] = {
          name: apt.client_name || apt.client || 'Desconhecido',
          phone: phone,
          lastVisit: apt.day ? `Dia ${apt.day}` : 'Recente'
        };
      }
    });

    return Object.values(clientsMap);
  }, [appointments]);

  return (
    <div className="glass-card flex flex-col h-full">
      <div className="p-4 border-b border-outline flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Clientes Recentes</h2>
        <button 
          onClick={onNewClient}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary-dark transition-all shadow-sm"
        >
          <UserPlus size={14} /> Novo
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {recentClients.length > 0 ? recentClients.map((client, idx) => (
          <motion.button 
            key={client.name + idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="w-full p-4 flex items-center gap-3 border-b border-outline last:border-0 hover:bg-gray-50/50 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-light/10 text-primary flex items-center justify-center font-bold text-xs">
              {client.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{client.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-gray-500">
                <span className="flex items-center gap-0.5 text-[10px] font-medium"><Phone size={10} /> {client.phone}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-medium"><Calendar size={10} /> {client.lastVisit}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </motion.button>
        )) : (
          <div className="p-8 text-center text-xs text-gray-400 font-medium italic">
            Nenhum cliente recente cadastrado.
          </div>
        )}
      </div>
      
      <div className="p-3 bg-gray-50 border-t border-outline flex justify-center mt-auto">
        <button className="text-[11px] font-bold text-primary hover:underline transition-all">
          Gerenciar Base de Clientes
        </button>
      </div>
    </div>
  );
}
