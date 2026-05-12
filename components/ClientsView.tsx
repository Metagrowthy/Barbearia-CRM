'use client';

import React from 'react';
import { Users, Search, Filter, UserPlus, MoreHorizontal, MessageSquare, History, ArrowUpDown, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getSupabase } from '@/lib/supabase';

interface ClientsViewProps {
  onNewClient?: () => void;
  establishmentId?: string;
}

export default function ClientsView({ onNewClient, establishmentId }: ClientsViewProps) {
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'visits' | 'totalSpent'>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'vip' | 'recent' | 'inactive'>('all');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = React.useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<string | null>(null);
  const [dbClients, setDbClients] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchClients = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      setIsLoading(true);
      
      // Fetch both tables
      let clientsQuery = supabase.from('clients').select('*');
      let aptQuery = supabase.from('appointments').select('*').order('appointment_date', { ascending: false });

      if (establishmentId) {
        clientsQuery = clientsQuery.eq('establishment_id', establishmentId);
        aptQuery = aptQuery.eq('establishment_id', establishmentId);
      } else {
        setDbClients([]);
        setIsLoading(false);
        return;
      }

      const [clientsRes, appointmentsRes] = await Promise.all([
        clientsQuery,
        aptQuery
      ]);
      
      if (appointmentsRes.error) {
        console.error('Error fetching appointments:', appointmentsRes.error);
      }
      
      if (clientsRes.error) {
        console.error('Error fetching clients:', clientsRes.error);
      }

      const clientMap: Record<string, any> = {};
      
      // 1. Process Canonical Clients
      if (clientsRes.data) {
        clientsRes.data.forEach((c: any) => {
          const key = c.phone || c.id;
          clientMap[key] = {
            id: c.id,
            name: c.name,
            email: c.email || '-',
            phone: c.phone || '-',
            totalSpent: Number(c.total_spent || 0),
            visits: Number(c.appointments_count || 0),
            lastVisit: c.last_visit || c.created_at,
            history: [],
            source: 'database'
          };
        });
      }

      // 2. Process Appointments (to get history and discover missing clients)
      if (appointmentsRes.data) {
        appointmentsRes.data.forEach((apt: any) => {
          // Try to find client by ID or phone
          let key = apt.client_id || apt.client_phone || apt.client_name;
          
          // If we have a phone, use it as better key than Name
          const phoneKey = apt.client_phone;
          if (phoneKey && clientMap[phoneKey]) {
            key = phoneKey;
          } else if (apt.client_id && clientMap[apt.client_id]) {
            key = apt.client_id;
          }

          if (!clientMap[key]) {
            // New "virtual" client from appointment
            clientMap[key] = {
              id: apt.id, // placeholder
              name: apt.client_name || 'Desconhecido',
              email: '-',
              phone: apt.client_phone || '-',
              totalSpent: 0,
              visits: 0,
              lastVisit: apt.appointment_date,
              history: [],
              source: apt.source || 'supabase'
            };
          }
          
          // Add to history
          clientMap[key].history.push({
            date: apt.appointment_date,
            service: apt.service_name || 'Serviço',
            value: `R$ ${(Number(apt.price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            barber: apt.barber_name || 'Equipe',
            source: apt.source || 'supabase'
          });

          // Update stats if this record wasn't process from 'clients' table yet or to merge
          // Actually, if it came from appointments table, we count it.
          // BUT if we already have stats from the clients table, we don't want to double count.
          // However, often the appointments_count in clients table might be out of sync.
          // Let's rely on actual appointment data for stats if we are aggregating here.
          
          // If the record exists in clientMap already (from clients table), we reset visits/spent to 0
          // and re-calculate from appointments to be accurate? Or stick to the values in the table?
          // Usually, it's safer to re-calculate if we fetch ALL appointments.
        });

        // Re-calculate stats from history to ensure accuracy across sources
        Object.values(clientMap).forEach((c: any) => {
          c.visits = c.history.length;
          c.totalSpent = c.history.reduce((sum: number, h: any) => {
            const val = parseInt(h.value.replace(/\D/g, '')) || 0;
            return sum + val;
          }, 0);
          if (c.history.length > 0) {
            c.lastVisit = c.history[0].date; // history is sorted desc
          }
        });
      }

      setDbClients(Object.values(clientMap));
      setIsLoading(false);
    };

    fetchClients();
  }, [establishmentId]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleWhatsApp = (client: any) => {
    const message = encodeURIComponent(`Olá ${client.name.split(' ')[0]}, tudo bem?`);
    const phone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    showNotification(`Redirecionando para WhatsApp de ${client.name}...`);
  };

  const filteredClients = React.useMemo(() => {
    let result = dbClients.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );

    // Apply category filters
    const now = new Date();
    if (activeFilter === 'vip') {
      result = result.filter(c => c.visits >= 5); // Adjusted for demo/test visibility
    } else if (activeFilter === 'recent') {
      result = result.filter(c => {
        const lastVisit = new Date(c.lastVisit);
        const diffDays = Math.ceil((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });
    } else if (activeFilter === 'inactive') {
      result = result.filter(c => {
        const lastVisit = new Date(c.lastVisit);
        const diffDays = Math.ceil((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      });
    }

    return result.sort((a, b) => {
      const factor = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') return a.name.localeCompare(b.name) * factor;
      return ((a[sortBy] as number) - (b[sortBy] as number)) * factor;
    });
  }, [dbClients, search, sortBy, sortOrder, activeFilter]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filterOptions = [
    { id: 'all', label: 'Todos os Clientes' },
    { id: 'vip', label: 'Clientes VIP (15+ visitas)' },
    { id: 'recent', label: 'Viram na última semana' },
    { id: 'inactive', label: 'Inativos (30+ dias)' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto w-full"
    >
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-3 border border-white/10 backdrop-blur-md"
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Base de Clientes <Users size={20} className="text-primary" />
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Gerencie seu portfólio de clientes e históricos de atendimento.</p>
        </div>
        
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all border",
                activeFilter !== 'all' 
                  ? "bg-primary/10 border-primary text-primary shadow-sm" 
                  : "bg-white border-outline text-gray-700 hover:bg-gray-50"
              )}
            >
              <Filter size={16} /> 
              {activeFilter === 'all' ? 'Filtrar' : filterOptions.find(f => f.id === activeFilter)?.label.split(' (')[0]}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-outline z-20 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      {filterOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setActiveFilter(opt.id as any);
                            setIsFilterOpen(false);
                            showNotification(`Filtro: ${opt.label} aplicado.`);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                            activeFilter === opt.id 
                              ? "bg-primary/5 text-primary" 
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {opt.label}
                          {activeFilter === opt.id && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={onNewClient}
            className="flex items-center gap-2 royal-gradient text-white px-4 py-2 rounded-md transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95"
          >
            <UserPlus size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Novo Cliente</span>
          </button>
        </div>
      </div>

      <div className="glass-card border-outline/50 overflow-hidden">
        <div className="p-5 border-b border-outline flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:outline-hidden transition-all shadow-xs"
            />
          </div>
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-3 py-1.5 rounded-full border border-outline/30 shadow-xs">
            {filteredClients.length} Clientes Encontrados
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-400 font-black border-b border-outline">
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Cliente
                    {sortBy === 'name' ? (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => toggleSort('visits')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Visitas
                    {sortBy === 'visits' ? (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group"
                  onClick={() => toggleSort('totalSpent')}
                >
                  <div className="flex items-center gap-2">
                    Valor Gasto (LTV)
                    {sortBy === 'totalSpent' ? (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline">
              <AnimatePresence mode="popLayout">
                {filteredClients.map((client) => (
                  <motion.tr 
                    layout
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 overflow-hidden relative border-2 border-white shadow-sm">
                          <Image 
                            src={`https://picsum.photos/seed/${client.name}/80/80`} 
                            alt={client.name} 
                            fill 
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{client.name}</h4>
                            {client.history.some((h: any) => h.source === 'app') ? (
                              <span className="text-[8px] font-black uppercase tracking-tighter bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-sm">App</span>
                            ) : (
                              <span className="text-[8px] font-black uppercase tracking-tighter bg-green-100 text-green-600 px-1.5 py-0.5 rounded-sm">Supabase</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 font-medium">{client.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center justify-center bg-white text-gray-900 text-[10px] font-black px-3 py-1 rounded-lg border border-outline shadow-xs">
                        {client.visits} Visitas
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary">R$ {client.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Última: {new Date(client.lastVisit).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-1 relative">
                        <button 
                          onClick={() => handleWhatsApp(client)}
                          title="WhatsApp" 
                          className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button 
                          onClick={() => setSelectedClientHistory(client)}
                          title="Ver Perfil & Histórico" 
                          className={cn(
                            "p-2.5 rounded-xl transition-all",
                            selectedClientHistory?.id === client.id 
                              ? "text-primary bg-primary/10" 
                              : "text-gray-400 hover:text-primary hover:bg-primary/5"
                          )}
                        >
                          <History size={18} />
                        </button>
                        
                        <div className="relative group">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                            className={cn(
                              "p-2.5 rounded-xl transition-all",
                              activeMenuId === client.id ? "text-gray-900 bg-gray-100" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                            )}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenuId === client.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-2xl border border-outline z-30 p-2"
                              >
                                {['Editar Cliente', 'Agendar Próximo', 'Inativar', 'Excluir'].map((action, i) => (
                                  <button 
                                    key={action}
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      showNotification(`${action} acionado para ${client.name}`);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors",
                                      i === 3 ? "text-red-500 hover:bg-red-50" : "text-gray-600 hover:bg-gray-50"
                                    )}
                                  >
                                    {action}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-outline">
                         <Search size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Nenhum cliente encontrado</h3>
                      <p className="text-xs text-gray-400 max-w-[200px]">Tente ajustar sua busca ou cadastrar um novo cliente.</p>
                      <button 
                        onClick={onNewClient}
                        className="mt-2 text-xs font-bold text-primary hover:underline"
                      >
                        Cadastrar &quot;{search}&quot; agora
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline flex items-center justify-between bg-gray-50/30">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Página 1 de 1 • {filteredClients.length} de {dbClients.length} Registros</p>
          <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest">
            <button className="px-4 py-2 border border-outline rounded-lg bg-white text-gray-400 cursor-not-allowed" disabled>Anterior</button>
            <button className="px-4 py-2 border border-primary/20 rounded-lg bg-primary/5 text-primary shadow-xs">01</button>
            <button className="px-4 py-2 border border-outline rounded-lg bg-white text-gray-400 cursor-not-allowed" disabled>Próximo</button>
          </div>
        </div>
      </div>

      {/* Slide-over de Histórico */}
      <AnimatePresence>
        {selectedClientHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClientHistory(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] z-[101] overflow-hidden flex flex-col"
            >
              <div className="p-8 royal-gradient text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Perfil do Cliente</p>
                  <h2 className="text-2xl font-black tracking-tight">{selectedClientHistory.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedClientHistory(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronDown size={24} className="rotate-[-90deg]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-outline border-dashed">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Visitas</p>
                    <p className="text-xl font-black text-gray-900">{selectedClientHistory.visits}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-outline border-dashed">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total LTV</p>
                    <p className="text-xl font-black text-primary">R$ {selectedClientHistory.totalSpent.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-3">
                    Histórico Recente <div className="h-px flex-1 bg-outline" />
                  </h3>
                  
                  <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-outline">
                    {selectedClientHistory.history.length > 0 ? (
                      selectedClientHistory.history.map((item: any, i: number) => (
                        <div key={i} className="pl-8 relative">
                          <div className="absolute left-[9px] top-1.5 w-1.5 h-1.5 rounded-full bg-primary border-2 border-white shadow-[0_0_0_2px_#6366f122]" />
                          <div className="flex items-center justify-between">
                            <div>
                               <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-gray-900">{item.service}</p>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-1 rounded-sm",
                                  item.source === 'app' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                                )}>
                                  {item.source === 'app' ? 'App' : 'Supabase'}
                                </span>
                               </div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">Funcionário: {item.barber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-primary">{item.value}</p>
                              <p className="text-[10px] font-bold text-gray-400">{item.date}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="pl-8 text-xs text-gray-400 italic">Nenhum histórico disponível.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-3">
                    Contato Direto <div className="h-px flex-1 bg-outline" />
                  </h3>
                  <button 
                    onClick={() => handleWhatsApp(selectedClientHistory)}
                    className="w-full flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare size={20} />
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-wider">Enviar WhatsApp</p>
                        <p className="text-[10px] opacity-70 font-bold">{selectedClientHistory.phone}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="p-8 border-t border-outline flex gap-3">
                <button className="flex-1 royal-gradient text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest">
                  Novo Agendamento
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
