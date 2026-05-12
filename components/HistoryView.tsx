'use client';

import React from 'react';
import { History, Search, Download, Filter, MoreHorizontal, MessageSquare, AlertCircle, CheckCircle2, Clock, Edit2, X, Save, Scissors, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { getSupabase } from '@/lib/supabase';

interface HistoryViewProps {
  onRefresh?: () => void;
  services?: any[];
  inventory?: {
    drinks: any[];
    supplies: any[];
  };
  establishmentId?: string;
}

export default function HistoryView({ 
  onRefresh, 
  services = [], 
  inventory = { drinks: [], supplies: [] },
  establishmentId
}: HistoryViewProps) {
  const [dbAppointments, setDbAppointments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'confirmado' | 'cancelado' | 'concluido'>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedApt, setSelectedApt] = React.useState<any>(null);
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
  const [productsQuantities, setProductsQuantities] = React.useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const performFetch = React.useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setIsLoading(true);
    
    try {
      let query = supabase.from('appointments').select('*');
      if (establishmentId) {
        query = query.eq('establishment_id', establishmentId);
      } else {
        setDbAppointments([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
      } else if (data) {
        setDbAppointments(data);
      }
    } catch (err) {
      console.error("Exception in performFetch:", err);
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId]);

  React.useEffect(() => {
    let mounted = true;
    
    async function init() {
      if (!mounted) return;
      await performFetch();
    }
    
    init();

    return () => {
      mounted = false;
    };
  }, [performFetch]);

  const handleOpenModal = (apt: any) => {
    setSelectedApt(apt);
    // Initial selection: try to find the service from name
    const initialServiceId = services.find(s => s.name === apt.service_name)?.id;
    setSelectedServices(initialServiceId ? [initialServiceId] : []);
    setProductsQuantities({});
    setIsModalOpen(true);
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const updateProductQty = (id: string, delta: number) => {
    setProductsQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const calculateTotal = () => {
    const servicesTotal = selectedServices.reduce((acc, id) => {
      const srv = services.find(s => s.id === id);
      return acc + (Number(srv?.price) || 0);
    }, 0);

    const productsTotal = Object.entries(productsQuantities).reduce((acc, [id, qty]) => {
      const allItems = [...inventory.drinks, ...inventory.supplies];
      const prod = allItems.find(p => String(p.id) === String(id));
      return acc + ((Number(prod?.price) || 0) * qty);
    }, 0);

    return servicesTotal + productsTotal;
  };

  const handleSaveAdjustment = async () => {
    if (!selectedApt) return;
    setIsSaving(true);
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      console.log('Starting save adjustment for apt:', selectedApt?.id);
      const total = calculateTotal();
      console.log('Calculated total:', total);
      
      const selectedSrvNames = selectedServices
        .map(id => services.find(s => s.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const productSummaryArr = Object.entries(productsQuantities)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([id, qty]) => {
          const prod = [...inventory.drinks, ...inventory.supplies].find(p => String(p.id) === String(id));
          return `${qty}x ${prod?.name}`;
        });

      const productSummary = productSummaryArr.join(', ');
      const finalServiceName = selectedSrvNames + (productSummary ? (selectedSrvNames ? ' + Consumo: ' : 'Consumo: ') + productSummary : '');

      console.log('Final service name:', finalServiceName);

      // 1. Update Appointment
      const updatePayload: any = {
        price: Number(total),
        service_name: finalServiceName,
        status: 'concluido'
      };

      console.log('Update payload:', updatePayload);

      const { error: aptError } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', selectedApt.id);

      if (aptError) {
        console.error('Supabase Apt Error:', aptError);
        throw new Error(`Erro no agendamento: ${aptError.message}`);
      }

      console.log('Apt updated successfully');

      // 2. Update Inventory Stock for selected products
      for (const [prodId, qty] of Object.entries(productsQuantities)) {
        if (Number(qty) > 0) {
          const allItems = [...inventory.drinks, ...inventory.supplies];
          const product = allItems.find(p => String(p.id) === String(prodId));
          if (product && product.stock !== undefined) {
             const newStock = Math.max(0, Number(product.stock) - Number(qty));
             console.log('Updating stock for product:', prodId, 'Original:', product.stock, 'New:', newStock);
             const { error: invError } = await supabase
              .from('inventory')
              .update({ stock: newStock })
              .eq('id', prodId);
             
             if (invError) {
               console.error('Error updating stock for:', prodId, invError);
             }
          }
        }
      }

      // 3. Create/Update Financial Record
      // First check if it already exists to avoid duplicates
      const { data: existingRecords } = await supabase
        .from('financial_records')
        .select('id')
        .eq('appointment_id', selectedApt.id)
        .limit(1);

      const finPayload = {
        description: `Atendimento: ${selectedApt.client_name || 'Cliente'}`,
        amount: Number(total),
        type: 'income',
        category: 'Serviço',
        date: selectedApt.appointment_date,
        barber_id: selectedApt.barber_id || selectedApt.barberId,
        appointment_id: selectedApt.id,
        establishment_id: establishmentId
      };

      if (existingRecords && existingRecords.length > 0) {
        await supabase
          .from('financial_records')
          .update(finPayload)
          .eq('id', existingRecords[0].id);
      } else {
        await supabase
          .from('financial_records')
          .insert([finPayload]);
      }

      await performFetch(); 
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
      alert('Atendimento atualizado com sucesso!');
    } catch (error: any) {
      console.error('Full Save Error details:', error);
      alert('Erro ao salvar ajuste: ' + (error.message || 'Erro desconhecido. Verifique o console.'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredHistory = React.useMemo(() => {
    return dbAppointments.filter(apt => {
      const matchesSearch = 
        apt.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        apt.barber_name?.toLowerCase().includes(search.toLowerCase()) ||
        apt.service_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = activeFilter === 'all' || apt.status === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [dbAppointments, search, activeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
      case 'scheduled':
        return <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5"><Clock size={10} /> Marcado</span>;
      case 'concluido':
      case 'completed':
        return <span className="bg-green-100 text-green-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5"><CheckCircle2 size={10} /> Concluído</span>;
      case 'cancelado':
      case 'cancelled':
        return <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5"><AlertCircle size={10} /> Cancelado</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Histórico de Agendamentos <History size={20} className="text-primary" />
          </h1>
          <p className="text-xs md:text-sm text-muted-theme mt-1">Auditagem completa de todos os atendimentos realizados.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
               const csvContent = "data:text/csv;charset=utf-8," 
                + "Data,Hora,Cliente,Serviço,Funcionário,Valor,Status\n"
                + filteredHistory.map(a => `${a.appointment_date},${a.start_time},${a.client_name},${a.service_name},${a.barber_name},${a.price},${a.status}`).join("\n");
               const encodedUri = encodeURI(csvContent);
               const link = document.createElement("a");
               link.setAttribute("href", encodedUri);
               link.setAttribute("download", "historico_agendamentos.csv");
               document.body.appendChild(link);
               link.click();
            }}
            className="flex items-center gap-2 bg-white border border-outline px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-xs"
          >
            <Download size={16} /> Exportar CSV
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
              placeholder="Buscar por cliente, serviço ou profissional..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline rounded-xl text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-hidden"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {['all', 'confirmado', 'concluido', 'cancelado'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activeFilter === f 
                    ? "bg-gray-900 text-white shadow-lg" 
                    : "bg-white text-gray-500 border border-outline hover:bg-gray-50"
                )}
              >
                {f === 'all' ? 'Ver Todos' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] uppercase tracking-[0.2em] text-muted-theme font-black border-b border-outline">
                <th className="px-6 py-4">Data & Horário</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Serviço & Preço</th>
                <th className="px-6 py-4">Funcionário</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Origem / Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando Histórico...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredHistory.map((apt) => {
                return (
                <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black transition-colors">
                        {apt.appointment_date ? new Date(apt.appointment_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem Data'}
                      </span>
                      <span className="text-[10px] font-bold text-muted-theme uppercase">{apt.start_time?.substring(0, 5)} - {apt.end_time?.substring(0, 5)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-gray-700">{apt.client_name || 'Desconhecido'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-600 line-clamp-2">{apt.service_name}</span>
                      <span className="text-sm font-black text-primary">R$ {(Number(apt.price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-gray-600">{apt.barber_name}</span>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(apt.status)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border",
                        apt.source === 'app' 
                          ? "bg-blue-50 text-blue-600 border-blue-100" 
                          : "bg-green-50 text-green-600 border-green-100"
                      )}>
                        {apt.source === 'app' ? 'Dashboard' : 'Agendamento Online'}
                      </span>
                      
                      <button 
                        onClick={() => handleOpenModal(apt)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 hover:underline transition-all"
                      >
                        <Edit2 size={10} /> Ajustar
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {!isLoading && filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nenhum registro encontrado para este filtro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-outline flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Novo Atendimento</h2>
                  <p className="text-xs text-muted-theme mt-1 uppercase font-bold tracking-widest">Ajustar Serviços e Consumo para {selectedApt?.client_name}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Services Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Scissors className="text-amber-500" size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Serviços Disponíveis</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map(srv => {
                      const isSelected = selectedServices.includes(srv.id);
                      return (
                        <button
                          key={srv.id}
                          onClick={() => toggleService(srv.id)}
                          className={cn(
                            "flex flex-col items-start p-4 rounded-xl border transition-all text-left group",
                            isSelected 
                              ? "border-primary bg-primary/5 ring-1 ring-primary" 
                              : "border-outline bg-white hover:border-gray-300 hover:shadow-xs"
                          )}
                        >
                          <span className="text-sm font-black text-gray-800">{srv.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-primary">R$ {Number(srv.price).toFixed(2)}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">• {srv.category}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Products Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="text-blue-500" size={16} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Consumo e Produtos</h3>
                  </div>
                  <div className="space-y-3">
                    {[...inventory.drinks, ...inventory.supplies].map(prod => {
                      const qty = productsQuantities[prod.id] || 0;
                      return (
                        <div key={prod.id} className="flex items-center justify-between p-4 bg-gray-50/50 border border-outline rounded-xl hover:bg-white transition-all group">
                          <div>
                            <span className="text-sm font-black text-gray-800">{prod.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">R$ {Number(prod.price).toFixed(2)}</span>
                              <span className="text-[10px] text-gray-400 uppercase font-bold">• {prod.category}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateProductQty(prod.id, -1)}
                              disabled={qty === 0}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border transition-all disabled:opacity-30",
                                qty > 0 ? "border-primary text-primary hover:bg-primary/5" : "border-outline text-gray-300"
                              )}
                            >
                              -
                            </button>
                            <span className="text-sm font-black w-4 text-center">{qty}</span>
                            <button 
                              onClick={() => updateProductQty(prod.id, 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-outline bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total do Atendimento</p>
                  <p className="text-2xl font-black text-primary">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <button 
                  onClick={handleSaveAdjustment}
                  disabled={isSaving || (selectedServices.length === 0 && Object.values(productsQuantities).every(v => v === 0))}
                  className="bg-gray-900 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSaving ? 'Salvando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
