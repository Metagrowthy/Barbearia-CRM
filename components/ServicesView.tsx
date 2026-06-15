'use client';

import React from 'react';
import { 
  Scissors, Plus, Search, Edit3, Trash2, CheckCircle, 
  Beer, Package, X, Clock, DollarSign, Tag, Info, ChevronRight, Save, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { getSupabase } from '@/lib/supabase';
import { getNicheConfig } from '@/lib/niches';

// Mock Data
const compressAndEncodeFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
  description?: string;
  image_url?: string;
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
  activeTab?: Category;
  onTabChange?: (tab: Category) => void;
  niche?: string;
}

export default function ServicesView({ 
  services,
  drinks, 
  supplies, 
  onUpdateServices,
  onUpdateDrinks, 
  onUpdateSupplies,
  appointments = [],
  establishmentId,
  activeTab: propActiveTab,
  onTabChange: propOnTabChange,
  niche = 'barbershop'
}: ServicesViewProps) {
  const nicheCfg = getNicheConfig(niche);
  const [localActiveTab, setLocalActiveTab] = React.useState<Category>('services');
  
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propOnTabChange !== undefined ? propOnTabChange : setLocalActiveTab;
  
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem é muito grande. Escolha uma imagem de até 5MB.");
      return;
    }

    try {
      const base64 = await compressAndEncodeFile(file);
      setFormData(prev => ({ ...prev, image_url: base64 }));
    } catch (err: any) {
      alert("Erro ao processar imagem: " + err.message);
    }
  };

  const [historyApts, setHistoryApts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchHistory = async () => {
      const supabase = getSupabase();
      if (!supabase || !establishmentId) return;
      const { data } = await supabase.from('appointments').select('service_id, service_name, status').eq('establishment_id', establishmentId);
      if (data) {
        setHistoryApts(data.filter((a: any) => a.status !== 'cancelado'));
      }
    };
    fetchHistory();
  }, [establishmentId]);

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
        type: activeTab === 'drinks' ? 'drink' : activeTab === 'supplies' ? 'supply' : undefined,
        description: '',
        image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const listMap = { services, drinks, supplies };
      const setMap = { 
        services: onUpdateServices, 
        drinks: onUpdateDrinks, 
        supplies: onUpdateSupplies 
      };
      
      const currentList = listMap[activeTab];
      const setter = setMap[activeTab];
      const supabase = getSupabase();
      
      // Check if it's a mock item being edited (does not exist in DB yet)
      const isMockItem = editingItem && (
        typeof editingItem.id === 'number' || 
        (typeof editingItem.id === 'string' && (editingItem.id.startsWith('mock-') || editingItem.id.length < 10))
      );

      if (editingItem && !isMockItem) {
        // Supabase Sync - Real Update
        if (supabase && (activeTab === 'drinks' || activeTab === 'supplies')) {
          const payload = {
            name: formData.name,
            price: formData.price,
            category: formData.category,
            stock: formData.stock,
            description: formData.description || null,
            image_url: formData.image_url || null
          };
          const { error } = await supabase
            .from('inventory')
            .update(payload)
            .eq('id', editingItem.id);
          
          if (error) {
            console.error('Supabase update error:', error);
            alert('Erro ao atualizar produto no banco de dados: ' + error.message);
            return;
          }
        } else if (supabase && activeTab === 'services') {
          const payload = {
            name: formData.name,
            price: formData.price,
            category: formData.category,
            duration: formData.duration || '30 min',
            description: formData.description || null,
            image_url: formData.image_url || null
          };
          const { error } = await supabase
            .from('services')
            .update(payload)
            .eq('id', editingItem.id);
          if (error) {
            console.error('Supabase update error:', error);
            alert('Erro ao atualizar serviço no banco de dados: ' + error.message);
            return;
          }
        }

        setter(currentList.map(i => i.id === editingItem.id ? { ...i, ...formData } as Item : i));
      } else {
        // Supabase Sync - Insert (New item or converting a Mock item to real DB row)
        const type = activeTab === 'drinks' ? 'drink' : activeTab === 'supplies' ? 'supply' : undefined;
        let finalId: string | number = Math.max(...currentList.map(i => typeof i.id === 'number' ? i.id : 0), 0) + 1;

        if (supabase && (activeTab === 'drinks' || activeTab === 'supplies')) {
          const payload = {
            name: formData.name,
            price: formData.price,
            category: formData.category,
            stock: formData.stock,
            type,
            establishment_id: establishmentId,
            description: formData.description || null,
            image_url: formData.image_url || null
          };
          const { data, error } = await supabase
            .from('inventory')
            .insert([payload])
            .select();
          
          if (error) {
            console.error('Supabase insert error:', error);
            alert('Erro ao criar produto no banco de dados: ' + error.message);
            return;
          }
          if (data?.[0]) finalId = data[0].id;
        } else if (supabase && activeTab === 'services') {
          const payload = {
            name: formData.name,
            price: formData.price,
            category: formData.category,
            duration: formData.duration || '30 min',
            establishment_id: establishmentId,
            description: formData.description || null,
            image_url: formData.image_url || null
          };
          const { data, error } = await supabase
            .from('services')
            .insert([payload])
            .select();
          if (error) {
             console.error('Supabase insert error:', error);
             alert('Erro ao criar serviço no banco de dados: ' + error.message);
             return;
          }
          if (data?.[0]) finalId = data[0].id;
        }

        if (editingItem && isMockItem) {
          // Promoted mock item: replace the mock element with the newly inserted DB row
          setter(currentList.map(i => i.id === editingItem.id ? { ...i, ...formData, id: finalId } as Item : i));
        } else {
          // Totally new item: append to the list
          const newItem = {
            ...formData,
            id: finalId,
            type
          } as Item;
          setter([...currentList, newItem]);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Crash in handleSave:', err);
      alert('Ocorreu um erro inesperado ao salvar: ' + (err.message || err));
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
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
        if (error) {
          console.error('Supabase delete error:', error);
          alert('Erro ao excluir do banco de dados: ' + error.message);
          return;
        }
      }

      setter((prev: Item[]) => prev.filter(i => i.id !== id));
    } catch (err: any) {
      console.error('Crash in handleDelete:', err);
      alert('Ocorreu um erro inesperado ao excluir: ' + (err.message || err));
    }
  };

  const currentItems = () => {
    const list = activeTab === 'services' ? services : activeTab === 'drinks' ? drinks : supplies;
    return list.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const tabs = [
    { 
      id: 'services', 
      label: nicheCfg.id === 'vet_pet' ? 'Serviços & Banhos' 
             : nicheCfg.id === 'pilates_yoga' ? 'Aulas & Pilates'
             : nicheCfg.id === 'personal_trainer' ? 'Aulas / Treinos'
             : 'Serviços', 
      icon: nicheCfg.icon 
    },
    { id: 'drinks', label: nicheCfg.beverageTerm, icon: Beer },
    { id: 'supplies', label: nicheCfg.supplyTerm, icon: Package },
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
          <p className="text-xs md:text-sm text-gray-500 mt-1">Gerencie menus de serviços, estoque de {nicheCfg.beverageTerm.toLowerCase()} e {nicheCfg.supplyTerm.toLowerCase()}.</p>
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
              className="glass-card group flex flex-col border-outline/50 hover:border-primary/30 overflow-hidden"
            >
              {/* Product/Service Image */}
              <div className="relative w-full aspect-video bg-gray-100 overflow-hidden border-b border-outline shrink-0">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=225&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center relative">
                    {activeTab === 'services' ? (
                      <Scissors className="text-primary/15 w-10 h-10" />
                    ) : activeTab === 'drinks' ? (
                      <Beer className="text-primary/15 w-10 h-10" />
                    ) : (
                      <Package className="text-primary/15 w-10 h-10" />
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 border-b border-outline bg-gray-50/20 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2.5 py-1 bg-primary/5 rounded-full border border-primary/10">
                      {item.category}
                    </span>
                    <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all translate-y-0 md:translate-y-[-5px] md:group-hover:translate-y-0">
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
                  {item.description && (
                    <p className="text-[11px] text-gray-500 font-semibold mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  )}
                  
                  {activeTab === 'services' ? (
                    <div className="flex flex-col gap-1 mt-3">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-amber-500" /> {item.duration}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="flex items-center gap-1.5 text-green-600"><CheckCircle size={12} /> Ativo</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-[0.1em] mt-1 bg-primary/5 w-fit px-2 py-0.5 rounded">
                        <Layers size={10} /> 
                        {historyApts.filter(a => String(a.service_id) === String(item.id) || (a.service_name && a.service_name.toLowerCase().includes(item.name.toLowerCase()))).length} Atendimentos
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className={cn(
                          "px-2 py-0.5 rounded",
                          (item.stock || 0) > 5 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        )}>
                          Estoque: {item.stock} un
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}
                        className="text-[9px] font-black uppercase text-primary border border-primary/20 bg-primary/5 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Plus size={10} /> Add Estoque
                      </button>
                    </div>
                  )}
                </div>
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
              Adicionar {activeTab === 'services' ? (nicheCfg.id === 'vet_pet' ? 'Serviço/Banho' : 'Serviço') : activeTab === 'drinks' ? nicheCfg.beverageTerm : nicheCfg.supplyTerm}
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
                    <Info size={12} /> Nome do {activeTab === 'services' ? (nicheCfg.id === 'vet_pet' ? 'Serviço/Banho' : 'Serviço') : nicheCfg.supplyTerm}
                  </label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden"
                    placeholder={`Ex: ${activeTab === 'services' ? nicheCfg.defaultServices[0].name : (activeTab === 'drinks' ? 'Água Mineral' : 'Pomada Modeladora')}`}
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
                      placeholder={`Ex: ${activeTab === 'services' ? nicheCfg.defaultServices[0].category : (activeTab === 'drinks' ? 'Bebidas' : 'Acessórios')}`}
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
                          type="button"
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
                      <Package size={12} /> Quantidade em Estoque
                    </label>
                    <input 
                      type="number"
                      value={formData.stock === undefined || Number.isNaN(formData.stock) ? '' : formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden"
                    />
                  </div>
                )}

                {/* Description input */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                    <Info size={12} /> Descrição Detalhada / Completa
                  </label>
                  <textarea 
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden resize-none text-gray-900 custom-scrollbar"
                    placeholder={activeTab === 'services' ? `Descreva detalhadamente o serviço para os clientes e assistentes de IA (ex: ${nicheCfg.defaultServices[0].description.substring(0, 60)}...)` : `Descreva detalhadamente o(a) ${nicheCfg.supplyTerm.toLowerCase()} para catálogo e IA...`}
                  />
                </div>

                {/* Photo URL / Upload input */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                    <Save size={12} /> Imagem do {activeTab === 'services' ? 'Serviço' : 'Produto'}
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4 items-center">
                      {/* Hidden File Input */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      
                      {/* Select from PC Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm border border-outline flex items-center gap-2 shrink-0 active:scale-95"
                      >
                        <Plus size={14} /> Selecionar do PC
                      </button>
                      
                      <span className="text-[10px] text-gray-400 font-bold uppercase">ou cole uma URL abaixo</span>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <input 
                          type="text"
                          value={formData.image_url || ''}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900"
                          placeholder="Link da imagem (ex: https://images.unsplash.com/...)"
                        />
                      </div>
                      {formData.image_url && (
                        <div className="w-16 h-16 rounded-xl border border-outline overflow-hidden shrink-0 bg-gray-50 shadow-sm relative group/preview">
                          <img 
                            src={formData.image_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: '' })}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                            title="Remover Imagem"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
