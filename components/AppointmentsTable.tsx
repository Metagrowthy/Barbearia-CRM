'use client';

import React from 'react';
import { MoreVertical, CheckCircle2, Clock, XCircle, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'confirmado':
      return <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
        <CheckCircle2 size={12} /> Confirmado
      </span>;
    case 'em-andamento':
      return <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
        <Clock size={12} /> Em Atendimento
      </span>;
    case 'pendente':
      return <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
        <Clock size={12} /> Pendente
      </span>;
    case 'cancelado':
      return <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
        <XCircle size={12} /> Cancelado
      </span>;
    default:
      return null;
  }
};

interface AppointmentsTableProps {
  onSeeAll?: () => void;
  appointments?: any[];
}

export default function AppointmentsTable({ onSeeAll, appointments: externalAppointments }: AppointmentsTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);

  // Use external appointments or empty array
  const activeAppointments = externalAppointments || [];

  const filteredAppointments = activeAppointments.filter(apt => {
    const matchesSearch = apt.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         apt.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? apt.status === statusFilter : apt.status !== 'cancelado';
    return matchesSearch && matchesStatus;
  });

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).format(today);

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-outline flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Agendamentos de Hoje</h2>
          <p className="text-[11px] text-gray-500 capitalize">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-gray-50 border border-outline rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-hidden transition-all w-48 font-medium"
            />
          </div>
          <button 
            onClick={() => setStatusFilter(statusFilter === 'confirmado' ? null : 'confirmado')}
            className={cn(
              "p-1.5 border rounded-md transition-colors",
              statusFilter === 'confirmado' ? "bg-primary/10 border-primary text-primary" : "border-outline text-gray-600 hover:bg-gray-50"
            )}
            title="Filtrar Confirmados"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-outline">
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Serviço</th>
              <th className="px-4 py-3 font-semibold">Profissional</th>
              <th className="px-4 py-3 font-semibold">Horário</th>
              <th className="px-4 py-3 font-semibold text-center">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Valor</th>
              <th className="px-4 py-3 font-semibold w-10"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt) => (
                  <motion.tr 
                    key={apt.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group hover:bg-gray-50/50 border-b border-outline last:border-0 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                          <Image 
                            src={`https://picsum.photos/seed/${apt.client}/32/32`} 
                            alt={apt.client} 
                            fill 
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors">{apt.client}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-medium">{apt.service}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-medium">{apt.barber}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 font-bold">{apt.time}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-bold text-gray-900">{apt.price}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-32"
                >
                  <td colSpan={7} className="text-center text-xs text-gray-400 font-medium italic">
                    Nenhum agendamento encontrado para os filtros aplicados.
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      <div className="p-3 bg-gray-50 border-t border-outline flex justify-center">
        <button 
          onClick={onSeeAll}
          className="text-[11px] font-bold text-primary hover:underline transition-all"
        >
          Ver todos os agendamentos
        </button>
      </div>
    </div>
  );
}
