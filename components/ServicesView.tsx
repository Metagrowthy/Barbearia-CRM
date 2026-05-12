'use client';

import React from 'react';
import { 
  Scissors, Plus, Search, Edit3, Trash2, CheckCircle, 
  Beer, Package, X, Clock, DollarSign, Tag, Info, ChevronRight, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { getSupabase } from '@/lib/supabase';

// Mock Data
const initialServices = [
  { id: 1, name: "Corte Masculino", duration: "45 min", price: 60.00, category: "Cabelo" },
  { id: 2, name: "Barba Profissional", duration: "30 min", price: 45.00, category: "Barba" },
  { id: 3, name: "Combo (Corte + Barba)", duration: "75 min", price: 95.00, category: "Combos" },
  { id: 4, name: "Hidratação Capilar", duration: "25 min", price: 40.00, category: "Tratamentos" },
];

type Category = 'services' | 'drinks' | 'supplies';

interface Item {
  id: string | number;
  name: string;
  price: number;
  category: string;
  duration?: string;
  stock?: number;
  type?: 'drink' | 'supply';
}

interface ServicesViewProps {
  services: Item[];
  drinks: Item[];
  supplies: Item[];
  onUpdateServices: React.Dispatch<React.SetStateAction<Item[]>>;
  onUpdateDrinks: React.Dispatch<React.SetStateAction<Item[]>>;
  onUpdateSupplies: React.Dispatch<React.SetStateAction<Item[]>>;
  appointments?: any[];
  establishmentId?: string;
}

export default function ServicesView({ 
  services,
  drinks, 
  supplies, 
  onUpdateServices,
  onUpdateDrinks, 
  onUpdateSupplies,
  appointments = [],
  establishmentId
}: ServicesViewProps) {
  const [activeTab, setActiveTab] = React.useState<Category>('services');
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Form State
  const [formData, setFormData] = React.useState<Partial<Item>>({
    name: '',
    price: 0,
    category: '',
    duration: '',
    stock: 0
  });

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: 0,
        category: '',
        duration: activeTab === 'services' ? '30 min' : undefined,
        stock: activeTab !== 'services' ? 0 : undefined,
        type: activeTab === 'drinks' ? 'drink' : activeTab === 'supplies' ? 'supply' : undefined
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const listMap = { services, drinks, supplies };
    const setMap = { 
      services: onUpdateServices, 
      drinks: onUpdateDrinks, 
      supplies: onUpdateSupplies 
    };
    
    const currentList = listMap[activeTab];
    const setter = setMap[activeTab];
    const supabase = getSupabase();
    
    // Helper to get number from duration string ("45 min" -> 45)
    const getDurationMinutes = (d?: string) => {
      if (!d) return 45;
      const num = parseInt(d.replace(/\D/g, ''), 10);
      return isNaN(num) ? 45 : num;
    };

    if (editingItem) {
      // Supabase Sync
      if (supabase && (activeTab === 'drinks' || activeTab === 'supplies')) {
        const payload = {
          name: formData.name,
          price: formData.price,
          category: formData.category,
          stock: formData.stock
        };
        const { error } = await supabase
          .from('inventory')
          .update(payload)
          .eq('id', editingItem.id);
        
        if (error) console.error('Supabase update error:', error);
      } else if (supabase && activeTab === 'services') {
        const payload = {
          name: formData.name,
          price: formData.price,
          category: formData.category,
          duration: formData.duration || '30 min'
        };
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) console.error('Supabase update error:', error);
      }

      setter(currentList.map(i => i.id === editingItem.id ? { ...i, ...formData } as Item : i));
    } else {
      const type = activeTab === 'drinks' ? 'drink' : activeTab === 'supplies' ? 'supply' : undefined;
      let finalId: string | number = Math.max(...currentList.map(i => typeof i.id === 'number' ? i.id : 0), 0) + 1;

      // Supabase Sync
      if (supabase && (activeTab === 'drinks' || activeTab === 'supplies')) {
        const payload = {
          name: formData.name,
          price: formData.price,
          category: formData.category,
          stock: formData.stock,
          type,
          establishment_id: establishmentId
        };
        const { data, error } = await supabase
          .from('inventory')
          .insert([payload])
          .select();
        
        if (error) {
          console.error('Supabase insert error:', error);
          alert('Erro ao salvar produto: ' + error.message);
          return;
        }
        if (data?.[0]) finalId = data[0].id;
      } else if (supabase && activeTab === 'services') {
        const payload = {
          name: formData.name,
          price: formData.price,
          category: formData.category,
          duration: formData.duration || '30 min',
          establishment_id: establishmentId
        };
        const { data, error } = await supabase
          .from('services')
          .insert([payload])
          .select();
        if (error) {
           console.error('Supabase insert error:', error);
           alert('Erro ao salvar serviço: ' + error.message);
           return;
        }
        if (data?.[0]) finalId = data[0].id;
      }

      const newItem = {
        ...formData,
        id: finalId,
        type
      } as Item;
      setter([...currentList, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string | number) => {
    const setMap = { 
      services: onUpdateServices, 
      drinks: onUpdateDrinks, 
      supplies: onUpdateSupplies 
    };
    const setter = setMap[activeTab];
    const supabase = getSupabase();

    if (supabase) {
      const table = activeTab === 'services' ? 'services' : 'inventory';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) console.error('Supabase delete error:', error);
    }

    setter((prev: Item[]) => prev.filter(i => i.id !== id));
  };

  const currentItems = () => {
    const list = activeTab === 'services' ? services : activeTab === 'drinks' ? drinks : supplies;
    return list.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const tabs = [
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'drinks', label: 'Bebidas', icon: Beer },
    { id: 'supplies', label: 'Produtos/Insumos', icon: Package },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-7xl mx-auto w-full"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Catálogo & Inventário <Package size={24} className="text-primary" />
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Gerencie menus de serviços, estoque de bebidas e produtos.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all sm:w-64"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 royal-gradient text-white px-5 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 shadow-md shrink-0"
          >
            <Plus size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline mb-8 gap-8 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Category)}
              className={cn(
                "flex items-center gap-2 py-4 px-2 border-b-2 transition-all relative",
                isActive 
                  ? "border-primary text-primary font-black scale-105" 
                  : "border-transparent text-gray-400 hover:text-gray-600 font-bold"
              )}
            >
              <Icon size={18} />
              <span className="text-xs uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-[1px] left-0 right-0 h-[3px] bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {currentItems().map((item, idx) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card group flex flex-col border-outline/50 hover:border-primary/30"
            >
              <div className="p-5 border-b border-outline bg-gray-50/20">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2.5 py-1 bg-primary/5 rounded-full border border-primary/10">
                    {item.category}
                  </span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-[-5px] group-hover:translate-y-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}
                      className="p-2 bg-white hover:bg-primary/5 rounded-xl border border-outline transition-all text-gray-400 hover:text-primary shadow-sm"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-2 bg-white hover:bg-red-50 rounded-xl border border-outline transition-all text-gray-400 hover:text-red-500 shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                
                {activeTab === 'services' ? (
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-amber-500" /> {item.duration}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="flex items-center gap-1.5 text-green-600"><CheckCircle size={12} /> Ativo</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-[0.1em] mt-1 bg-primary/5 w-fit px-2 py-0.5 rounded">
                      <Scissors size={10} /> 
                      {appointments.filter(a => a.service_id === item.id || a.serviceId === item.id || a.service === item.name).length} Atendimentos
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-bold uppercase tracking-widest">
                    <span className={cn(
                      "px-2 py-0.5 rounded",
                      (item.stock || 0) > 5 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      Estoque: {item.stock} un
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex items-center justify-between bg-white mt-auto">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Preço</p>
                  <span className="text-lg font-black text-gray-900 tracking-tight">
                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-primary transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty placeholder card to add new */}
        <button 
          onClick={() => handleOpenModal()}
          className="border-2 border-dashed border-outline hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all group min-h-[180px]"
        >
          <div className="p-4 bg-gray-50 group-hover:bg-primary/10 rounded-full transition-colors border border-outline border-dashed group-hover:border-primary/30">
            <Plus size={32} className="text-gray-300 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">
              Adicionar {activeTab === 'services' ? 'Serviço' : activeTab === 'drinks' ? 'Bebida' : 'Produto'}
            </p>
          </div>
        </button>
      </div>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 royal-gradient text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    {editingItem ? <Edit3 size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">{editingItem ? 'Editar Item' : 'Novo Cadastro'}</h2>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Módulo de Catálogo</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                    <Info size={12} /> Nome do {activeTab === 'services' ? 'Serviço' : 'Produto'}
                  </label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden"
                    placeholder="Ex: Corte Degradê com Navalha"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                      <DollarSign size={12} /> Preço (R$)
                    </label>
                    <input 
                      type="number"
                      value={formData.price === undefined || Number.isNaN(formData.price) ? '' : formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                      <Tag size={12} /> Categoria
                    </label>
                    <input 
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden"
                      placeholder="Ex: Barba"
                    />
                  </div>
                </div>

                {activeTab === 'services' ? (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                      <Clock size={12} /> Duração Estimada
                    </label>
                    <div className="flex gap-2">
                       {['30 min', '45 min', '60 min', '90 min'].map(d => (
                         <button 
                          key={d}
                          onClick={() => setFormData({ ...formData, duration: d })}
                          className={cn(
                            "flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-all",
                            formData.duration === d ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-outline text-gray-500 hover:border-primary/30"
                          )}
                         >
                           {d}
                         </button>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                      <Package size={12} /> Quantidade Inicial em Estoque
                    </label>
                    <input 
                      type="number"
                      value={formData.stock === undefined || Number.isNaN(formData.stock) ? '' : formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-outline flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 border border-outline rounded-2xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-white transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] py-3.5 royal-gradient text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Save size={18} />
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
