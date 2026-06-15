'use client'

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  PieChart as PieChartIcon,
  ShoppingBag,
  Users,
  Calendar,
  Filter,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

const COLORS = ['#00328a', '#0052cc', '#3385ff', '#80b3ff'];

interface FinanceViewProps {
  appointments: any[];
  financialRecords: any[];
  barbers: any[];
  services: any[];
  inventory: {
    drinks: any[];
    supplies: any[];
  };
  onUpdateBarbers?: (newBarbers: any[]) => void;
  establishmentId?: string;
  activeTab?: 'overview' | 'flow' | 'commissions' | 'inventory';
  onTabChange?: (tab: 'overview' | 'flow' | 'commissions' | 'inventory') => void;
}

export default function FinanceView({ 
  appointments, 
  financialRecords, 
  barbers, 
  services, 
  inventory, 
  onUpdateBarbers,
  establishmentId,
  activeTab: propActiveTab,
  onTabChange: propOnTabChange
}: FinanceViewProps) {
  const [localActiveTab, setLocalActiveTab] = React.useState<'overview' | 'flow' | 'commissions' | 'inventory'>('overview');
  
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propOnTabChange !== undefined ? propOnTabChange : setLocalActiveTab;

  const [editingBarberId, setEditingBarberId] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<any>({});
  const [period, setPeriod] = React.useState('Este Mês');
  const [showCustomDate, setShowCustomDate] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Flow Filters State
  const [flowSearch, setFlowSearch] = React.useState('');
  const [flowCategory, setFlowCategory] = React.useState('All');
  const [flowType, setFlowType] = React.useState('All');
  const [flowSource, setFlowSource] = React.useState('All');
  const [flowLimit, setFlowLimit] = React.useState(20);
  const [flowPage, setFlowPage] = React.useState(1);

  // Reset page to 1 whenever filters or limit change
  React.useEffect(() => {
    setFlowPage(1);
  }, [flowSearch, flowCategory, flowType, flowSource, flowLimit]);

  const [newRecord, setNewRecord] = React.useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Geral',
    date: new Date().toISOString().split('T')[0],
    barber_id: ''
  });

  // Combined and filtered data
  const filteredData = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    const combine = [
      ...appointments.map(a => {
        const appointmentValue = a.price !== undefined ? a.price : a.value;
        return {
          ...a,
          source: 'appointment' as const,
          date: a.date || a.appointment_date,
          amount: typeof appointmentValue === 'number' ? 
            (isNaN(appointmentValue) ? 0 : appointmentValue) : 
            (parseFloat(String(appointmentValue || 0).replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0),
          type: 'income' as const
        };
      }),
      ...financialRecords.map(r => {
        const foundBarber = (barbers || []).find(b => b.id === r.barber_id);
        return {
          ...r,
          source: 'manual' as const,
          amount: parseFloat(String(r.amount || 0)) || 0,
          type: r.type as 'income' | 'expense',
          barber: foundBarber ? foundBarber.name : (r.barber || '')
        };
      })
    ];

    return combine.filter(item => {
      if (!item || !item.date) return false;

      // Evitar contagem duplicada: se o agendamento está concluído e já existe um registro financeiro
      // vinculado a ele (appointment_id), ignoramos a entrada do agendamento para faturamento.
      if (item.source === 'appointment' && (item.status === 'concluido' || item.status === 'completed')) {
        const hasLinkedRecord = financialRecords.some(r => r.appointment_id === item.id);
        if (hasLinkedRecord) return false;
      }

      // Timezone-safe local parsing
      const dateOnly = String(item.date).split('T')[0];
      const [y, m, d] = dateOnly.split('-').map(Number);
      if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
      
      const itemDate = new Date(y, m - 1, d, 12, 0, 0);
      const itemTime = itemDate.getTime();

      if (period === 'Personalizado' && startDate && endDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const [ey, em, ed] = endDate.split('-').map(Number);
        if (!isNaN(sy) && !isNaN(ey)) {
          const start = new Date(sy, sm - 1, sd, 0, 0, 0).getTime();
          const end = new Date(ey, em - 1, ed, 23, 59, 59).getTime();
          return itemTime >= start && itemTime <= end;
        }
      }

      if (period === 'Hoje') return itemTime >= startOfToday && itemTime <= endOfToday;
      if (period === 'Esta Semana') {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0,0,0,0);
        return itemTime >= weekStart.getTime();
      }
      if (period === 'Este Mês') return m - 1 === now.getMonth() && y === now.getFullYear();
      if (period === 'Ano') return y === now.getFullYear();
      return true;
    });
  }, [appointments, financialRecords, period, startDate, endDate, barbers]);

  const flowFilteredData = React.useMemo(() => {
    return filteredData.filter(item => {
      // 1. Filter by Search Query (Description, Client Name, Barber Name, Date, Month Name)
      const desc = (item.source === 'appointment' ? `Atendimento: ${item.client || item.client_name}` : item.description || '').toLowerCase();
      const barber = (item.barber || '').toLowerCase();
      
      // Also allow searching by formatted date (e.g., '26/05', '2026')
      const formattedDate = String(item.date).split('T')[0].split('-').reverse().join('/');
      
      // Support searching by Portuguese month name (e.g., 'janeiro', 'maio')
      const monthNamesPt = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const dateOnly = String(item.date).split('T')[0];
      const [_, monthNum] = dateOnly.split('-').map(Number);
      const monthName = (monthNum && monthNum >= 1 && monthNum <= 12) ? monthNamesPt[monthNum - 1] : '';

      const query = flowSearch.toLowerCase();
      const matchesSearch = desc.includes(query) || barber.includes(query) || formattedDate.includes(query) || monthName.includes(query);

      // 2. Filter by Category
      const itemCategory = item.category || (item.source === 'appointment' ? 'Serviço' : 'Geral');
      const matchesCategory = flowCategory === 'All' || itemCategory === flowCategory;

      // 3. Filter by Type
      const matchesType = flowType === 'All' || item.type === flowType;

      // 4. Filter by Source (Sistema vs Manual)
      const matchesSource = flowSource === 'All' || item.source === flowSource;

      return matchesSearch && matchesCategory && matchesType && matchesSource;
    });
  }, [filteredData, flowSearch, flowCategory, flowType, flowSource]);

  const stats = React.useMemo(() => {
    const incomeItems = filteredData.filter(i => {
      if (i.source === 'appointment') {
        const status = (i.status || '').toLowerCase();
        return status !== 'cancelado' && (status === 'concluido' || status === 'agendado' || status === 'confirmado' || status === 'atendido' || status === 'pago');
      }
      return i.type === 'income';
    });

    const expenseItems = filteredData.filter(i => i.type === 'expense');

    const totalIncome = incomeItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalExpenses = expenseItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
    // Calculate total commissions to subtract from profit
    // Reuse logic similar to the commissions report to be consistent
    const totalCommissions = (barbers || []).reduce((acc, barber) => {
      const barberApps = filteredData.filter(a => {
        const status = (a.status || '').toLowerCase();
        const matchesBarber = a.barber_id === barber.id || a.barberId === barber.id || a.barber === barber.name;
        
        if (!matchesBarber) return false;
        
        if (a.source === 'appointment') {
          return status !== 'cancelado' && (status === 'concluido' || status === 'agendado' || status === 'confirmado' || status === 'atendido' || status === 'pago');
        } else if (a.source === 'manual') {
          return a.type === 'income';
        }
        return false;
      });

      const commissionType = barber.commission_type || 'percentage';
      const commissionRate = barber.commission_rate !== undefined ? barber.commission_rate : 40;
      const commissionFixed = barber.commission_fixed_value || 15;

      const gross = barberApps.reduce((vacc, vcurr) => {
        let val = Number(vcurr.amount) || 0;
        if (vcurr.source === 'appointment') {
          const srv = services?.find(s => s.id === vcurr.service_id || s.name === vcurr.service);
          if (srv && srv.price !== undefined) {
            val = parseFloat(String(srv.price).replace(',', '.'));
          }
        }
        return vacc + val;
      }, 0);
      const totalBarberCommission = commissionType === 'percentage' 
        ? gross * (commissionRate / 100) 
        : barberApps.length * commissionFixed;
      
      return acc + totalBarberCommission;
    }, 0);

    const actualProfit = totalIncome - totalExpenses - totalCommissions;
    const ticketMedio = incomeItems.length > 0 ? totalIncome / incomeItems.length : 0;
    
    // Occupancy still based on appointments
    const aptsInPeriod = filteredData.filter(i => i.source === 'appointment');
    const totalServiceMinutes = aptsInPeriod.reduce((acc, curr) => {
      const appDuration = curr.duration_minutes || curr.durationMinutes;
      if (appDuration) return acc + Number(appDuration);

      const srv = services.find(s => s.id === curr.service_id || s.id === curr.serviceId);
      if (srv?.duration_minutes) return acc + srv.duration_minutes;
      if (srv?.duration) {
        const num = parseInt(srv.duration.replace(/\D/g, ''), 10);
        return acc + (isNaN(num) ? 30 : num);
      }
      return acc + 30;
    }, 0);

    let daysInPeriod = 1;
    if (period === 'Esta Semana') daysInPeriod = 7;
    else if (period === 'Este Mês') daysInPeriod = 30;
    else if (period === 'Ano') daysInPeriod = 365;
    else if (period === 'Personalizado' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const totalCapacityMinutes = barbers.length * 8 * 60 * daysInPeriod;
    const occupancy = totalCapacityMinutes > 0 ? (totalServiceMinutes / totalCapacityMinutes) * 100 : 0;

    return {
      gross: totalIncome,
      expenses: totalExpenses,
      profit: actualProfit,
      commissionTotal: totalCommissions,
      ticket: ticketMedio,
      occupancy: Math.min(isNaN(occupancy) ? 0 : occupancy, 100),
      count: incomeItems.length
    };
  }, [filteredData, barbers, services, period, startDate, endDate]);


  const chartData = React.useMemo(() => {
    // This chart logic needs to be robust for all periods
    const currentYear = new Date().getFullYear();
    const now = new Date();

    if (period === 'Hoje' || (period === 'Personalizado' && startDate && endDate && startDate === endDate)) {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
      return hours.map(h => {
        const hInt = parseInt(h.split(':')[0]);
        const hourItems = filteredData.filter(i => {
          const d = new Date(String(i.date).includes('T') ? i.date : `${i.date}T12:00:00`);
          return d.getHours() >= hInt && d.getHours() < hInt + 2;
        });
        const receita = hourItems.filter(i => i.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const despesa = hourItems.filter(i => i.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        return { name: h, receita, despesa };
      });
    }

    if (period === 'Esta Semana') {
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      weekStart.setDate(now.getDate() - now.getDay());
      return dias.map((name, i) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        const dayItems = filteredData.filter(item => {
          const d = new Date(item.date);
          return d.getDate() === dayDate.getDate() && d.getMonth() === dayDate.getMonth();
        });
        const receita = dayItems.filter(i => i.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const despesa = dayItems.filter(i => i.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        return { name, receita, despesa };
      });
    }

    if (period === 'Este Mês') {
      const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      return weeks.map((name, i) => {
        const weekItems = filteredData.filter(item => {
          const d = new Date(item.date);
          const day = d.getDate();
          return day > i * 7 && day <= (i + 1) * 7;
        });
        const receita = weekItems.filter(i => i.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const despesa = weekItems.filter(i => i.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        return { name, receita, despesa };
      });
    }

    // Default: Ano (Months)
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses.map((name, index) => {
      const monthItems = filteredData.filter(i => {
        if (!i.date) return false;
        const dateOnly = String(i.date).split('T')[0];
        const [_, m] = dateOnly.split('-').map(Number);
        return (m - 1) === index;
      });
      const receita = monthItems.filter(i => {
        if (i.source === 'appointment') {
          const status = (i.status || '').toLowerCase();
          return status !== 'cancelado' && (status === 'concluido' || status === 'agendado' || status === 'confirmado' || status === 'atendido' || status === 'pago');
        }
        return i.type === 'income';
      }).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const despesa = monthItems.filter(i => i.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      return { name, receita, despesa };
    });
  }, [filteredData, period, startDate, endDate]);

  const handleSaveRecord = async () => {
    if (!newRecord.description || !newRecord.amount) {
      alert('Por favor, preencha a descrição e o valor.');
      return;
    }

    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    if (!supabase) {
      alert('Erro de conexão com o banco de dados.');
      return;
    }

    const payload: any = {
      ...newRecord,
      amount: parseFloat(newRecord.amount.toString().replace(',', '.')),
      establishment_id: establishmentId
    };

    if (!payload.barber_id) {
      delete payload.barber_id;
    }

    const { error } = await supabase.from('financial_records').insert([payload]);
    if (error) {
      console.error('Erro Supabase:', error);
      alert('Erro ao salvar lançamento: ' + error.message);
    } else {
      setIsModalOpen(false);
      setNewRecord({
        description: '',
        amount: '',
        type: 'expense',
        category: 'Geral',
        date: new Date().toISOString().split('T')[0],
        barber_id: ''
      });
    }
  };

  const kpis = [
    { 
      title: 'Faturamento Bruto', 
      value: `R$ ${stats.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      trend: '+12.5%', 
      positive: true, 
      icon: DollarSign,
      desc: 'Total de serviços e entradas'
    },
    { 
      title: 'Resultado Líquido', 
      value: `R$ ${stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      trend: stats.profit >= 0 ? '+8.2%' : '-15.4%', 
      positive: stats.profit >= 0, 
      icon: TrendingUp,
      desc: 'Pós despesas totais'
    },
    { 
      title: 'Despesas Totais', 
      value: `R$ ${stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      trend: '-5.2%', 
      positive: true, 
      icon: ArrowDownCircle,
      desc: 'Custos operacionais e outros'
    },
    { 
      title: 'Taxa de Ocupação', 
      value: `${stats.occupancy.toFixed(0)}%`, 
      trend: '+5.4%', 
      positive: true, 
      icon: Calendar,
      desc: 'Tempo produtivo vs total'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Modal Novo Lançamento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-outline"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Novo Lançamento</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gestão de Caixa</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Plus className="rotate-45 text-gray-400" size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Tipo de Lançamento */}
                  <div className="flex p-1 bg-gray-100 rounded-2xl">
                    <button
                      onClick={() => setNewRecord({ ...newRecord, type: 'expense' })}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        newRecord.type === 'expense' ? 'bg-white text-red-500 shadow-sm shadow-red-100' : 'text-gray-400'
                      }`}
                    >
                      <ArrowDownCircle size={14} className="inline mr-2" /> Despesa
                    </button>
                    <button
                      onClick={() => setNewRecord({ ...newRecord, type: 'income' })}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        newRecord.type === 'income' ? 'bg-white text-green-500 shadow-sm shadow-green-100' : 'text-gray-400'
                      }`}
                    >
                      <ArrowUpCircle size={14} className="inline mr-2" /> Entrada
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Descrição</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Aluguel, Compra de café, Venda avulsa..."
                        value={newRecord.description}
                        onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Valor (R$)</label>
                        <input 
                          type="number" 
                          placeholder="0,00"
                          value={newRecord.amount}
                          onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Data</label>
                        <input 
                          type="date" 
                          value={newRecord.date}
                          onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Categoria</label>
                      <select 
                        value={newRecord.category}
                        onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                      >
                        <option>Geral</option>
                        <option>Aluguel & Contas</option>
                        <option>Estoque</option>
                        <option>Marketing</option>
                        <option>Equipamentos</option>
                        <option>Salários</option>
                        <option>Serviço</option>
                        <option>Venda de Produtos</option>
                      </select>
                    </div>

                    {newRecord.type === 'income' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Funcionário Responsável</label>
                        <select 
                          value={newRecord.barber_id}
                          onChange={(e) => setNewRecord({ ...newRecord, barber_id: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                        >
                          <option value="">Nenhum / Geral</option>
                          {barbers.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleSaveRecord}
                    className="w-full py-5 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 hover:brightness-110 active:brightness-90 transition-all mt-4 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Confirmar Lançamento
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header com Filtros Rápidos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Controle Financeiro <TrendingUp size={20} className="text-primary" />
          </h1>
          <p className="text-xs md:text-sm text-muted-theme mt-1">Gestão estratégica de lucros, custos e performance.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
          <div className="flex flex-wrap bg-white p-1 rounded-xl shadow-sm border border-outline w-full md:w-auto">
            {['Hoje', 'Esta Semana', 'Este Mês', 'Ano'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setShowCustomDate(false);
                }}
                className={`px-4 py-1.5 rounded-lg text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${
                  period === p ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="p-2.5 bg-white border border-outline rounded-xl text-gray-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Tabs Internas */}
      <div className="flex gap-1 bg-gray-100/50 p-1 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Visão Geral', icon: PieChartIcon },
          { id: 'flow', label: 'Fluxo de Caixa', icon: DollarSign },
          { id: 'commissions', label: 'Comissões', icon: Users },
          { id: 'inventory', label: 'Estoque & Insumos', icon: ShoppingBag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="glass-card p-5 rounded-3xl border border-outline shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-primary/5 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                    <kpi.icon size={20} />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                    kpi.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {kpi.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {kpi.trend}
                  </div>
                </div>
                <p className="text-[10px] font-black text-muted-theme uppercase tracking-[0.15em] mb-1">{kpi.title}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{kpi.value}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">{kpi.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Tendência (Principal) */}
            <div className="lg:col-span-3 glass-card p-6 rounded-3xl border border-outline shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Receita vs Despesas</h3>
                  <p className="text-[10px] text-muted-theme font-bold">Acompanhamento mensal de saúde financeira</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                    <span className="text-[10px] font-black uppercase text-gray-400">Receita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <span className="text-[10px] font-black uppercase text-gray-400">Despesas</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      formatter={(val: any) => `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Bar dataKey="receita" fill="#00328a" radius={[6, 6, 0, 0]} name="Receita" />
                    <Bar dataKey="despesa" fill="#f87171" radius={[6, 6, 0, 0]} name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </>
      )}

      {activeTab === 'flow' && (
        <div className="glass-card rounded-3xl border border-outline shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-outline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Extrato de Fluxo de Caixa</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Registros de entradas e saídas do período</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={14} /> Novo Lançamento
            </button>
          </div>

          {/* Barra de Busca e Filtros Inteligentes */}
          <div className="px-6 py-4 bg-gray-50/40 border-b border-outline flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Campo de Busca Principal */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por cliente, descrição, funcionário ou data (dd/mm/aaaa)..."
                value={flowSearch}
                onChange={(e) => setFlowSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none"
              />
              {flowSearch && (
                <button 
                  onClick={() => setFlowSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs font-bold"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5">
              {/* Filtro de Categoria */}
              <div className="flex-1 md:flex-initial min-w-[140px]">
                <select
                  value={flowCategory}
                  onChange={(e) => setFlowCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="All">Todas as Categorias</option>
                  <option value="Serviço">Serviço</option>
                  <option value="Aluguel & Contas">Aluguel & Contas</option>
                  <option value="Estoque">Estoque</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Salários">Salários</option>
                  <option value="Geral">Geral</option>
                  <option value="Venda de Produtos">Venda de Produtos</option>
                </select>
              </div>

              {/* Filtro de Tipo (Entrada/Saída) */}
              <div className="flex-1 md:flex-initial min-w-[130px]">
                <select
                  value={flowType}
                  onChange={(e) => setFlowType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="All">Todos os Tipos</option>
                  <option value="income">Entrada (+)</option>
                  <option value="expense">Saída (-)</option>
                </select>
              </div>

              {/* Filtro de Origem (Sistema/Manual) */}
              <div className="flex-1 md:flex-initial min-w-[130px]">
                <select
                  value={flowSource}
                  onChange={(e) => setFlowSource(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="All">Todas as Origens</option>
                  <option value="appointment">Sistema (Automático)</option>
                  <option value="manual">Manual (Lançado)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-[0.2em] text-muted-theme font-black border-b border-outline">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Origem</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {flowFilteredData
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice((flowPage - 1) * flowLimit, flowPage * flowLimit)
                  .map((item, idx) => {
                    const isIncome = item.type === 'income';
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">
                          {String(item.date).split('T')[0].split('-').reverse().join('/')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-black text-gray-900 flex items-center gap-2">
                            {item.source === 'appointment' ? `Atendimento: ${item.client || item.client_name}` : item.description}
                            {item.source === 'manual' && (
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm('Deseja excluir este registro?')) {
                                    const { getSupabase } = await import('@/lib/supabase');
                                    const supabase = getSupabase();
                                    if (supabase) {
                                      const { error } = await supabase.from('financial_records').delete().eq('id', item.id);
                                      if (error) alert('Erro ao excluir: ' + error.message);
                                      else window.location.reload(); // Refresh to show changes
                                    }
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          {item.barber && (
                            <div className="text-[10px] text-gray-400 font-bold">{item.barber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            item.source === 'appointment' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.category || (item.source === 'appointment' ? 'Serviço' : 'Geral')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[10px] font-black flex items-center gap-1 ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                             {isIncome ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                             {item.source === 'appointment' ? 'Sistema' : 'Manual'}
                           </span>
                        </td>
                        <td className={`px-6 py-4 text-xs font-black text-right ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                          {isIncome ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                {flowFilteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-gray-400 font-bold italic">
                      Nenhum registro encontrado para este período ou busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação / Limite de Itens no rodapé do extrato */}
          <div className="px-6 py-4 bg-gray-50/30 border-t border-outline flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Texto de Resumo */}
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider min-w-[200px]">
              {flowFilteredData.length === 0 
                ? "Nenhum registro encontrado" 
                : `Mostrando ${((flowPage - 1) * flowLimit) + 1} a ${Math.min(flowFilteredData.length, flowPage * flowLimit)} de ${flowFilteredData.length} registros`
              }
            </span>

            {/* Controles de Páginas */}
            {Math.ceil(flowFilteredData.length / flowLimit) > 1 && (
              <div className="flex items-center gap-2 bg-white border border-outline rounded-xl p-1 shadow-sm">
                <button
                  disabled={flowPage === 1}
                  onClick={() => setFlowPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-colors duration-250 cursor-pointer"
                >
                  Anterior
                </button>
                <span className="text-[10px] font-black text-gray-500 px-3 border-x border-outline select-none">
                  Pág {flowPage} de {Math.ceil(flowFilteredData.length / flowLimit)}
                </span>
                <button
                  disabled={flowPage === Math.ceil(flowFilteredData.length / flowLimit)}
                  onClick={() => setFlowPage(prev => Math.min(Math.ceil(flowFilteredData.length / flowLimit), prev + 1))}
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-colors duration-250 cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            )}

            {/* Seletor de Limite */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Exibir:</span>
              <div className="flex bg-white border border-outline rounded-xl p-0.5 shadow-sm">
                {[20, 50, 100, 'Todos'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFlowLimit(opt === 'Todos' ? 999999 : Number(opt))}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      (opt === 'Todos' && flowLimit === 999999) || (typeof opt === 'number' && flowLimit === opt)
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-3xl border border-outline shadow-sm overflow-hidden">
             <div className="p-6 border-b border-outline">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Relatório de Comissões</h3>
             </div>
             <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] uppercase tracking-[0.2em] text-muted-theme font-black border-b border-outline">
                      <th className="px-6 py-4">Funcionário</th>
                      <th className="px-6 py-4">Serviços</th>
                      <th className="px-6 py-4">Bruto</th>
                      <th className="px-6 py-4">Comissão (%)</th>
                      <th className="px-6 py-4 text-right">A Pagar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {barbers.map((barber, idx) => {
                      const isEditing = editingBarberId === barber.id;
                      
                      const apps = filteredData.filter(a => {
                        const status = (a.status || '').toLowerCase();
                        const matchesBarber = a.barber_id === barber.id || a.barberId === barber.id || a.barber === barber.name;
                        
                        if (!matchesBarber) return false;
                        
                        if (a.source === 'appointment') {
                          return status !== 'cancelado' && (status === 'concluido' || status === 'agendado' || status === 'confirmado' || status === 'atendido' || status === 'pago');
                        } else if (a.source === 'manual') {
                          return a.type === 'income';
                        }
                        return false;
                      });
                      
                      const commissionType = isEditing ? (editValues.commission_type || barber.commission_type || 'percentage') : (barber.commission_type || 'percentage');
                      const commissionRate = isEditing ? (editValues.commission_rate ?? (barber.commission_rate !== undefined ? barber.commission_rate : 40)) : (barber.commission_rate !== undefined ? barber.commission_rate : 40);
                      const commissionFixed = isEditing ? (editValues.commission_fixed_value ?? (barber.commission_fixed_value || 15)) : (barber.commission_fixed_value || 15);

                      const gross = apps.reduce((acc, curr) => {
                        let val = curr.amount || 0;
                        if (curr.source === 'appointment') {
                          const srv = services?.find(s => s.id === curr.service_id || s.name === curr.service);
                          if (srv && srv.price !== undefined) {
                            val = parseFloat(String(srv.price).replace(',', '.'));
                          }
                        }
                        return acc + val;
                      }, 0);
                      
                      const totalCommission = commissionType === 'percentage' 
                        ? gross * (commissionRate / 100) 
                        : apps.length * commissionFixed;
                      
                      const handleStartEdit = () => {
                        setEditingBarberId(barber.id);
                        setEditValues({
                          commission_type: barber.commission_type || 'percentage',
                          commission_rate: barber.commission_rate !== undefined ? barber.commission_rate : 40,
                          commission_fixed_value: barber.commission_fixed_value || 15
                        });
                      };

                      const handleCancelEdit = () => {
                        setEditingBarberId(null);
                        setEditValues({});
                      };

                      const handleSaveEdit = () => {
                        if (onUpdateBarbers) {
                          const updatedBarbers = barbers.map(b => b.id === barber.id ? { 
                            ...b, 
                            commission_type: editValues.commission_type,
                            commission_rate: editValues.commission_rate,
                            commission_fixed_value: editValues.commission_fixed_value
                          } : b);
                          onUpdateBarbers(updatedBarbers);
                        }
                        setEditingBarberId(null);
                        setEditValues({});
                      };
                      
                      return (
                        <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${isEditing ? 'bg-primary/5' : ''}`}>
                          <td className="px-6 py-4 font-black text-xs text-gray-900">
                            <div>{barber.name}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                              {commissionType === 'percentage' ? `${commissionRate}% de comissão` : `R$ ${Number(commissionFixed).toFixed(2)} por atendimento`}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-500">{apps.length} atendimentos</td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-900">R$ {gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-500">
                             {isEditing ? (
                               <div className="flex flex-col gap-2">
                                 <select 
                                   value={editValues.commission_type}
                                   onChange={(e) => setEditValues({ ...editValues, commission_type: e.target.value })}
                                   className="p-1.5 bg-white border border-outline rounded-lg text-[10px] font-black uppercase outline-none"
                                 >
                                   <option value="percentage">% Perc</option>
                                   <option value="fixed">R$ Fixo</option>
                                 </select>
                                 <input 
                                   type="number"
                                   value={editValues.commission_type === 'fixed' ? (editValues.commission_fixed_value || 0) : (editValues.commission_rate || 0)}
                                   onChange={(e) => {
                                     const val = parseFloat(e.target.value);
                                     setEditValues({ 
                                       ...editValues, 
                                       [editValues.commission_type === 'fixed' ? 'commission_fixed_value' : 'commission_rate']: isNaN(val) ? 0 : val 
                                     });
                                   }}
                                   className="w-20 p-1.5 bg-white border border-outline rounded-lg text-xs font-black outline-none"
                                 />
                               </div>
                             ) : (
                               <span>{commissionType === 'percentage' ? `${commissionRate}%` : 'Fixo'}</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-right">
                             <div className="flex flex-col items-end gap-2">
                               <span className="text-primary">R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                               {isEditing ? (
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={handleSaveEdit}
                                     className="text-[9px] bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 shadow-sm"
                                   >
                                     Salvar
                                   </button>
                                   <button 
                                     onClick={handleCancelEdit}
                                     className="text-[9px] bg-gray-400 text-white px-2 py-1 rounded-md hover:bg-gray-500 shadow-sm"
                                   >
                                     X
                                   </button>
                                 </div>
                               ) : (
                                 <button 
                                   onClick={handleStartEdit}
                                   className="text-[9px] font-black uppercase text-primary/60 hover:text-primary tracking-widest"
                                 >
                                   Ajustar
                                 </button>
                               )}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
          <div className="space-y-4">
             <div className="p-6 bg-primary text-white rounded-3xl shadow-lg ring-1 ring-primary/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Total de Comissões</p>
                <h3 className="text-2xl font-black mb-1">
                  R$ {stats.commissionTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] font-bold opacity-80">Referente ao período selecionado</p>
             </div>
              <div className="p-6 bg-white border border-outline rounded-3xl">
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">Regras de Comissionamento</h4>
                 <div className="space-y-3">
                   {barbers.slice(0, 3).map(b => (
                     <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                       <span className="text-[10px] font-bold text-gray-600">{b.name}</span>
                       <span className="text-[10px] font-black text-primary uppercase">
                         {b.commission_type === 'fixed' ? `R$ ${(b.commission_fixed_value || 15).toFixed(2)}/atend` : `${b.commission_rate || 40}%`}
                       </span>
                     </div>
                   ))}
                   {barbers.length > 3 && (
                     <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest pt-2">Ver todos nas configurações</p>
                   )}
                 </div>
              </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-outline shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">Alertas de Reposição</h3>
              <div className="space-y-4">
                {[...inventory.drinks, ...inventory.supplies]
                  .filter(i => (i.stock || 0) < 10)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="text-red-500" size={18} />
                        <div>
                          <p className="text-xs font-black text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Apenas {item.stock || 0} un em estoque</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-black uppercase text-red-500 hover:underline">Comprar</button>
                    </div>
                  ))}
                {[...inventory.drinks, ...inventory.supplies].filter(i => (i.stock || 0) < 10).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-green-50/30 rounded-2xl border border-dashed border-green-200">
                    <CheckCircle className="text-green-500 mb-2" size={24} />
                    <p className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em]">Estoque Saudável</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-outline shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">Consumo por Produto</h3>
              <div className="space-y-6">
                {[...inventory.drinks, ...inventory.supplies].slice(0, 5).map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-gray-700">{item.name}</span>
                      <span className="text-[10px] font-black text-gray-400">Estoque: {item.stock || 0} un</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.stock && item.stock < 10 ? 'bg-red-500' : 'bg-primary'} transition-all duration-1000`} 
                        style={{ width: `${Math.min(((item.stock || 0) / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className={item.stock && item.stock < 10 ? 'text-red-500' : 'text-gray-400'}>
                        Preço: R$ {Number(item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-outline shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Listagem Geral de Itens</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] uppercase tracking-[0.2em] text-muted-theme font-black border-b border-outline">
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Preço</th>
                    <th className="px-6 py-4">Estoque</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {[...inventory.drinks, ...inventory.supplies].map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-gray-900">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase text-gray-400">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">{item.stock || 0} un</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                          (item.stock || 0) > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {(item.stock || 0) > 10 ? 'OK' : 'Baixo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
