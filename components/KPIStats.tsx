'use client';

import React from 'react';
import { TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ label, value, trend, icon: Icon, color }: StatCardProps) => {
  const isPositive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-${color}/10 text-${color}`}>
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      </div>
      
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>

      <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-gray-900 pointer-events-none">
        <Icon size={80} />
      </div>
    </motion.div>
  );
};

interface KPIStatsProps {
  timeRange?: string;
  appointments?: any[];
}

export default function KPIStats({ timeRange = 'Hoje', appointments = [] }: KPIStatsProps) {
  const stats = React.useMemo(() => {
    // Current date logic
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Filter by range
    const filteredByRange = appointments.filter(apt => {
      if (apt.status === 'cancelado') return false;
      const aptDate = apt.fullDate || apt.appointment_date;
      if (!aptDate) return false;

      if (timeRange === 'Hoje') return aptDate === todayStr || apt.day === now.getDate();
      // Simple logic for week/month for demo
      return true; 
    });

    const revenue = filteredByRange.reduce((acc, apt) => {
      const rawPrice = apt.price !== undefined ? apt.price : apt.value;
      const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || 0).replace(/[^\d.,]/g, '').replace(',', '.'));
      return acc + (isNaN(price) ? 0 : price);
    }, 0);

    const uniqueClients = new Set(filteredByRange.map(a => a.client_phone)).size;
    const count = filteredByRange.length;

    return {
      revenue,
      clients: uniqueClients,
      count,
      occupancy: count > 0 ? Math.min(Math.round((count / (8 * 3)) * 100), 100) : 0 // Assuming 8 slots x 3 barbers
    };
  }, [appointments, timeRange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard 
        label={`Faturamento ${timeRange}`} 
        value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
        trend={12.5} 
        icon={DollarSign} 
        color="primary"
      />
      <StatCard 
        label={`Clientes Atendidos (${timeRange})`} 
        value={stats.clients.toString()} 
        trend={8.2} 
        icon={Users} 
        color="blue-500"
      />
      <StatCard 
        label={`Agendamentos ${timeRange}`} 
        value={stats.count.toString()} 
        trend={5.4} 
        icon={Calendar} 
        color="indigo-500"
      />
      <StatCard 
        label="Taxa de Ocupação Est." 
        value={`${stats.occupancy}%`} 
        trend={4.1} 
        icon={TrendingUp} 
        color="green-600"
      />
    </div>
  );
}
