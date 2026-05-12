'use client';

import React from 'react';
import { 
  Settings as SettingsIcon, Bell, Shield, Smartphone, Paintbrush, Globe, 
  Cloud, UserCircle, CreditCard, Save, RotateCcw, Check, AlertCircle,
  Instagram, MessageCircle, Mail, Lock, Eye, EyeOff, LayoutTemplate,
  Palette, Camera, ExternalLink, Trash2, Plus, Code, Link, Zap, Scissors,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const settingsSections = [
  { id: 'profile', icon: UserCircle, title: 'Perfil da Barbearia', desc: 'Informações básicas, logo e contatos.' },
  { id: 'barbers', icon: Scissors, title: 'Equipe & Funcionários', desc: 'Gerencie sua equipe e especialidades.' },
  { id: 'hours', icon: Clock, title: 'Horários de Funcionamento', desc: 'Defina os horários de abertura e fechamento.' },
  { id: 'billing', icon: CreditCard, title: 'Faturamento', desc: 'Assinatura, métodos de pagamento e invoices.' },
  { id: 'theme', icon: Paintbrush, title: 'Personalização', desc: 'Altere o layout do seu app' },
];

interface SettingsViewProps {
  profile: any;
  theme: {
    primaryColor: string;
    layout: 'modern' | 'classic';
    bgTheme?: string;
  };
  barbers?: any[];
  onUpdateBarbers?: (barbers: any[]) => void;
  onProfileUpdate: (newProfile: any) => void;
  onThemeUpdate: (newTheme: { primaryColor?: string; layout?: 'modern' | 'classic'; bgTheme?: string }) => void;
  externalHours?: any[];
  onUpdateBusinessHours?: (hours: any[]) => void;
}

export default function SettingsView({ 
  profile: initialProfile, 
  theme: initialTheme,
  barbers: externalBarbers,
  onUpdateBarbers,
  onProfileUpdate, 
  onThemeUpdate,
  externalHours,
  onUpdateBusinessHours
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = React.useState('profile');
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [notificationText, setNotificationText] = React.useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationText(msg);
    setTimeout(() => setNotificationText(null), 3000);
  };
  
  // State for simulated profile data
  const [localProfile, setLocalProfile] = React.useState({
    name: initialProfile.name,
    address: initialProfile.address || 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    phone: initialProfile.phone || '(11) 99876-5432',
    email: initialProfile.email || 'contato@royalprecision.com',
    logo: initialProfile.logo,
    heroImage: initialProfile.heroImage,
    description: initialProfile.description,
    userName: initialProfile.userName || 'John Doe'
  });

  // Keep localProfile in sync if initialProfile changes after mounting (e.g. fetchData finishes)
  React.useEffect(() => {
    setLocalProfile({
      name: initialProfile.name,
      address: initialProfile.address || 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      phone: initialProfile.phone || '(11) 99876-5432',
      email: initialProfile.email || 'contato@royalprecision.com',
      logo: initialProfile.logo,
      heroImage: initialProfile.heroImage,
      description: initialProfile.description,
      userName: initialProfile.userName || 'John Doe'
    });
  }, [initialProfile]);

  // State for Theme/Appearance
  const [selectedColor, setSelectedColor] = React.useState(initialTheme.primaryColor);
  const [selectedLayout, setSelectedLayout] = React.useState<'modern' | 'classic'>(initialTheme.layout);
  const [selectedBgTheme, setSelectedBgTheme] = React.useState(initialTheme.bgTheme || 'original');
  const [localBarbers, setLocalBarbers] = React.useState(externalBarbers || []);

  // Sync localBarbers when externalBarbers is loaded
  const hasLoadedExternal = React.useRef(false);
  React.useEffect(() => {
    if (externalBarbers && externalBarbers.length > 0 && !hasLoadedExternal.current) {
      setLocalBarbers(externalBarbers);
      hasLoadedExternal.current = true;
    }
  }, [externalBarbers]);

  const bgThemes = [
    { id: 'original', name: 'Original', colors: { main: '#f7f9fb', secondary: '#ffffff' } },
    { id: 'cinza-profissional', name: 'Cinza Profissional', colors: { main: '#2c3e50', secondary: '#34495e' } },
  ];

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    // Instant update
    onThemeUpdate({ primaryColor: color, bgTheme: selectedBgTheme, layout: selectedLayout });
  };

  const handleLayoutChange = (layout: 'modern' | 'classic') => {
    setSelectedLayout(layout);
    // Instant update
    onThemeUpdate({ primaryColor: selectedColor, layout: layout, bgTheme: selectedBgTheme });
  };

  const handleBgThemeChange = (themeId: string) => {
    setSelectedBgTheme(themeId);
    // Instant update
    onThemeUpdate({ primaryColor: selectedColor, layout: selectedLayout, bgTheme: themeId });
  };

  // State for Billing (Cards)
  const [cards, setCards] = React.useState([
    { id: 1, brand: 'VISA', last4: '4412', expiry: '08/28' }
  ]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      onProfileUpdate({
        ...localProfile
      });
      onThemeUpdate({
        primaryColor: selectedColor,
        layout: selectedLayout,
        bgTheme: selectedBgTheme
      });
      if (onUpdateBarbers) {
        onUpdateBarbers(localBarbers);
      }
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const handleDiscard = () => {
    setLocalProfile({
      name: initialProfile.name,
      address: initialProfile.address || 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      phone: initialProfile.phone || '(11) 99876-5432',
      email: initialProfile.email || 'contato@royalprecision.com',
      logo: initialProfile.logo,
      heroImage: initialProfile.heroImage,
      description: initialProfile.description,
      userName: initialProfile.userName || 'John Doe'
    });
    setSelectedColor(initialTheme.primaryColor);
    setSelectedLayout(initialTheme.layout);
    setSelectedBgTheme(initialTheme.bgTheme || 'original');
    setLocalBarbers(externalBarbers || []);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLocalProfile(prev => ({ ...prev, logo: base64String }));
        showNotification("Logo carregada com sucesso!");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCard = (id: number) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const renderProfile = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLogoChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="w-32 h-32 rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-xl relative">
            <Image src={localProfile.logo} alt="Logo" fill className="object-cover" referrerPolicy="no-referrer" />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -right-2 -bottom-2 p-2 bg-primary text-white rounded-xl shadow-lg scale-90 group-hover:scale-100 transition-transform active:scale-95"
          >
            <Camera size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-4 w-full">
          <div>
            <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-1.5">Nome da Unidade</label>
            <input 
              type="text" 
              value={localProfile.name} 
              onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-1.5">Seu Nome (Perfil Sidebar)</label>
            <input 
              type="text" 
              value={localProfile.userName} 
              onChange={e => setLocalProfile({...localProfile, userName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-1.5">WhatsApp Comercial</label>
                <input 
                  type="text" 
                  value={localProfile.phone} 
                  onChange={e => setLocalProfile({...localProfile, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900" 
                />
             </div>
             <div>
                <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-1.5">E-mail Público</label>
                <input 
                  type="email" 
                  value={localProfile.email} 
                  onChange={e => setLocalProfile({...localProfile, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900" 
                />
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-outline">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-1.5">Endereço da Unidade</label>
          <input 
            type="text" 
            value={localProfile.address} 
            onChange={e => setLocalProfile({...localProfile, address: e.target.value})} 
            className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900" 
          />
        </div>



        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-1.5">Descrição / Bio da Unidade</label>
          <textarea 
            value={localProfile.description || ''} 
            onChange={e => setLocalProfile({...localProfile, description: e.target.value})} 
            className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900 h-24 resize-none"
            placeholder="Ex: Expertise em cortes clássicos e barba desde 2010."
          />
        </div>

      </div>
    </div>
  );

  const renderBarbers = () => {
    const updateBarberField = (id: string, field: string, value: any) => {
      setLocalBarbers(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const addNewBarber = () => {
      const newBarber = {
        id: `new-${Date.now()}`,
        name: 'Novo Funcionário',
        specialty: 'Cortes Clássicos',
        color: 'bg-primary'
      };
      setLocalBarbers(prev => [...prev, newBarber]);
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-muted-theme uppercase tracking-widest">Lista de Profissionais Ativos</p>
          <button 
            onClick={addNewBarber}
            className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest ring-1 ring-primary/20 px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all shadow-xs"
          >
            <Plus size={14} /> Adicionar Novo
          </button>
        </div>
        
        <div className="grid gap-4">
          {localBarbers.map((barber) => (
            <div key={barber.id || barber.name} className="p-5 bg-white border border-outline rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-theme uppercase tracking-widest block">Nome Exibido</label>
                  <input 
                    type="text" 
                    value={barber.name} 
                    onChange={(e) => updateBarberField(barber.id, 'name', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-outline rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-theme uppercase tracking-widest block">Especialidade / Título</label>
                  <input 
                    type="text" 
                    value={barber.specialty || ''} 
                    onChange={(e) => updateBarberField(barber.id, 'specialty', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-outline rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900"
                  />
                </div>
              </div>

              {/* Commission Customization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50/50 p-4 rounded-2xl border border-outline/50">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-theme uppercase tracking-widest block">Tipo de Comissão</label>
                  <select 
                    value={barber.commission_type || 'percentage'}
                    onChange={(e) => updateBarberField(barber.id, 'commission_type', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-outline rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900 appearance-none"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-theme uppercase tracking-widest block">
                    {barber.commission_type === 'fixed' ? 'Valor Fixo (por atendimento)' : 'Porcentagem (%)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">
                      {barber.commission_type === 'fixed' ? 'R$' : '%'}
                    </span>
                    <input 
                      type="number"
                      value={barber.commission_type === 'fixed' ? (barber.commission_fixed_value || 15) : (barber.commission_rate || 40)}
                      onChange={(e) => updateBarberField(barber.id, barber.commission_type === 'fixed' ? 'commission_fixed_value' : 'commission_rate', Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 bg-white border border-outline rounded-xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-outline">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] font-black text-muted-theme uppercase tracking-widest block mb-2">Cor na Agenda</label>
                    <div className="flex flex-wrap gap-2">
                       {[
                         { class: 'bg-primary', label: 'Amarelo' },
                         { class: 'bg-indigo-500', label: 'Indigo' },
                         { class: 'bg-green-500', label: 'Verde' },
                         { class: 'bg-amber-500', label: 'Laranja' },
                         { class: 'bg-rose-500', label: 'Rosa' },
                         { class: 'bg-teal-500', label: 'Teal' },
                         { class: 'bg-blue-500', label: 'Azul' },
                         { class: 'bg-purple-500', label: 'Roxo' }
                       ].map((c) => (
                         <button 
                           key={c.class}
                           onClick={() => updateBarberField(barber.id, 'color', c.class)}
                           className={cn(
                             "w-6 h-6 rounded-full border-2 transition-all",
                             (barber.color === c.class || (!barber.color && c.class === 'bg-primary')) ? "border-gray-900 scale-110" : "border-transparent hover:scale-105",
                             c.class
                           )}
                           title={c.label}
                         />
                       ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setLocalBarbers(prev => prev.filter(b => b.id !== barber.id));
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl mt-8">
           <h5 className="text-xs font-black text-amber-700 flex items-center gap-2 mb-2">
             <AlertCircle size={14} /> Dica de Gerenciamento
           </h5>
           <p className="text-[10px] text-amber-600 font-medium leading-relaxed uppercase tracking-tight">
             Ao alterar os nomes aqui, eles serão atualizados automaticamente em todos os filtros da agenda, dashboards e relatórios de comissão.
           </p>
        </div>
      </div>
    );
  };

  const renderHours = () => {
    const defaultHours = [
      { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
      { day_of_week: 1, open_time: '08:00', close_time: '19:00', is_closed: false },
      { day_of_week: 2, open_time: '08:00', close_time: '19:00', is_closed: false },
      { day_of_week: 3, open_time: '08:00', close_time: '19:00', is_closed: false },
      { day_of_week: 4, open_time: '08:00', close_time: '19:00', is_closed: false },
      { day_of_week: 5, open_time: '08:00', close_time: '19:00', is_closed: false },
      { day_of_week: 6, open_time: '08:00', close_time: '14:00', is_closed: false },
    ];

    // Ensure we always have 7 days, merging external data if exists
    const hoursList = Array.from({ length: 7 }, (_, i) => {
      const existing = externalHours?.find(h => h.day_of_week === i);
      return existing || defaultHours[i];
    });

    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    const updateHour = (day: number, field: string, value: any) => {
      const updated = hoursList.map(h => h.day_of_week === day ? { ...h, [field]: value } : h);
      if (onUpdateBusinessHours) onUpdateBusinessHours(updated);
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Painel de Horários da Loja</p>
           <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]" /> Aberto</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200" /> Fechado</div>
           </div>
        </div>
        
        <div className="grid gap-3">
          {weekdays.map((dayName, idx) => {
            const h = hoursList.find(item => item.day_of_week === idx) || { day_of_week: idx, open_time: null, close_time: null, is_closed: true };
            const isClosed = h.is_closed;

            return (
              <div key={idx} className={cn(
                "p-4 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6",
                isClosed 
                  ? "bg-gray-50/50 border-outline opacity-60 grayscale-[0.5]" 
                  : "bg-white border-outline shadow-sm hover:shadow-md hover:border-primary/20"
              )}>
                <div className="flex items-center gap-4 min-w-[160px]">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors relative",
                    isClosed ? "bg-gray-200 text-gray-500" : "bg-primary text-white shadow-lg shadow-primary/20"
                  )}>
                    {dayName.substring(0, 3)}
                    {!isClosed && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#39ff14] rounded-full border-2 border-white shadow-[0_0_5px_#39ff14]" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900">{dayName}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      {isClosed ? 'Unidade Inativa' : 'Atendimento Ativo'}
                    </p>
                  </div>
                </div>
                
                {!isClosed ? (
                  <div className="flex flex-wrap items-center gap-6 flex-1 justify-between md:justify-end">
                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Entrada</span>
                         <div className="relative group">
                           <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                           <input 
                             type="time" 
                             value={h.open_time || '08:00'} 
                             onChange={(e) => updateHour(idx, 'open_time', e.target.value)}
                             className="pl-9 pr-3 py-2 bg-gray-50 border border-outline rounded-xl text-xs font-black font-mono focus:ring-4 focus:ring-primary/10 hover:border-gray-300 outline-hidden transition-all"
                           />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Saída</span>
                         <div className="relative group">
                           <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                           <input 
                             type="time" 
                             value={h.close_time || '18:00'} 
                             onChange={(e) => updateHour(idx, 'close_time', e.target.value)}
                             className="pl-9 pr-3 py-2 bg-gray-50 border border-outline rounded-xl text-xs font-black font-mono focus:ring-4 focus:ring-primary/10 hover:border-gray-300 outline-hidden transition-all"
                           />
                         </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateHour(idx, 'is_closed', true)}
                      className="px-5 py-2.5 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all border border-transparent hover:border-red-100 flex items-center gap-2"
                    >
                      <RotateCcw size={14} /> Fechar Loja
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex justify-end">
                    <button 
                      onClick={() => updateHour(idx, 'is_closed', false)}
                      className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-[#39ff14] hover:text-black hover:shadow-[0_0_20px_#39ff14aa] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                    >
                      <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Reabrir Agendamentos
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBilling = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Plano Atual</p>
          <h3 className="text-xl font-black transition-colors">Premium Pro <span className="text-sm font-bold text-muted-theme">(Anual)</span></h3>
        </div>
        <button className="bg-white px-5 py-2 rounded-xl text-xs font-black text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm">Alterar Plano</button>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-theme flex items-center gap-2">
           <CreditCard size={14} /> Métodos de Pagamento
        </h4>
        {cards.map(card => (
          <div key={card.id} className="p-4 bg-white border border-outline rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-black text-[10px] text-gray-400">{card.brand}</div>
              <div>
                <p className="text-sm font-bold text-gray-900">•••• •••• •••• {card.last4}</p>
                <p className="text-[10px] text-muted-theme font-bold uppercase">Expira em {card.expiry}</p>
              </div>
            </div>
            <button onClick={() => removeCard(card.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
          </div>
        ))}
        <button className="w-full py-4 border-2 border-dashed border-outline rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all">
          + Adicionar Novo Cartão
        </button>
      </div>
    </div>
  );

  const renderTheme = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-4 flex items-center gap-2">
          <Palette size={14} /> Cor Primária da Marca
        </label>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {[
            '#00328a', '#6366f1', '#f43f5e', '#10b981', '#f59e0b', 
            '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#475569',
            '#b91c1c', '#ea580c', '#15803d', '#1d4ed8', '#7e22ce',
            '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa'
          ].map(color => (
            <button 
              key={color} 
              onClick={() => handleColorChange(color)}
              style={{ backgroundColor: color }}
              className={cn(
                "w-full aspect-square rounded-xl border-4 border-white shadow-lg ring-2 transition-all relative",
                selectedColor === color ? "ring-primary" : "ring-transparent hover:ring-gray-200"
              )}
            >
              {selectedColor === color && <Check className="absolute inset-0 m-auto text-white" size={16} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-4 flex items-center gap-2">
          <Smartphone size={14} /> Tema de Fundo (Background)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {bgThemes.map(theme => (
            <button 
              key={theme.id} 
              onClick={() => handleBgThemeChange(theme.id)}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all flex flex-col text-left group",
                selectedBgTheme === theme.id ? "border-primary bg-primary/5 shadow-md" : "border-outline bg-white hover:border-gray-300"
              )}
            >
              <div 
                className="w-full h-12 rounded-xl mb-3 shadow-inner border border-black/5"
                style={{ backgroundColor: theme.colors.main }}
              >
                <div 
                  className="w-1/2 h-full rounded-l-xl opacity-50"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
              </div>
              <p className={cn("text-[9px] font-black uppercase tracking-tight", selectedBgTheme === theme.id ? "text-primary" : "text-gray-500")}>
                {theme.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-[10px] font-black text-muted-theme uppercase tracking-widest block mb-4 flex items-center gap-2">
            <LayoutTemplate size={14} /> Layout do Painel
          </label>
          <div className="grid grid-cols-2 gap-4">
             <button 
              onClick={() => handleLayoutChange('modern')}
              className={cn(
                "p-4 border-2 rounded-2xl text-center transition-all",
                selectedLayout === 'modern' ? "border-primary bg-primary/5 shadow-sm" : "border-outline bg-white hover:border-gray-300"
              )}
             >
                <div className={cn("w-12 h-1 rounded-full mx-auto mb-2", selectedLayout === 'modern' ? "bg-primary" : "bg-gray-300")} />
                <p className={cn("text-[10px] font-black uppercase", selectedLayout === 'modern' ? "text-primary" : "text-gray-400")}>Moderno</p>
             </button>
             <button 
              onClick={() => handleLayoutChange('classic')}
              className={cn(
                "p-4 border-2 rounded-2xl text-center transition-all",
                selectedLayout === 'classic' ? "border-primary bg-primary/5 shadow-sm" : "border-outline bg-white hover:border-gray-300"
              )}
             >
                <div className={cn("w-12 h-1 rounded-full mx-auto mb-2", selectedLayout === 'classic' ? "bg-primary" : "bg-gray-300")} />
                <p className={cn("text-[10px] font-black uppercase", selectedLayout === 'classic' ? "text-primary" : "text-gray-400")}>Clássico</p>
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfile();
      case 'barbers': return renderBarbers();
      case 'hours': return renderHours();
      case 'billing': return renderBilling();
      case 'theme': return renderTheme();
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Central de Configurações <SettingsIcon size={24} className="text-primary" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Personalize sua unidade do Royal Precision com total flexibilidade.</p>
        </div>
        
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              key="success-msg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg"
            >
              <Check size={16} /> Configurações Salvas!
            </motion.div>
          )}
          {notificationText && (
            <motion.div 
              key="notification-msg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/10"
            >
              <Zap size={14} className="text-amber-400 fill-amber-400" /> {notificationText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 flex flex-row lg:flex-col gap-3 sticky top-8 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "p-3 md:p-5 rounded-2xl border transition-all text-left flex items-center gap-3 md:gap-5 relative overflow-hidden group shrink-0 lg:shrink",
                  isActive 
                    ? "bg-gray-900 border-gray-900 text-white shadow-2xl lg:translate-x-3" 
                    : "bg-white border-outline text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "p-2 md:p-3 rounded-xl transition-all",
                  isActive ? "bg-white/10" : "bg-gray-50 group-hover:bg-primary/5 group-hover:text-primary"
                )}>
                  <Icon size={18} />
                </div>
                <div className="relative z-10">
                  <h4 className={cn("text-[10px] md:text-sm font-black uppercase tracking-tight whitespace-nowrap", isActive ? "text-white" : "text-gray-900")}>
                    {section.title}
                  </h4>
                  <p className={cn("hidden md:block text-[10px] font-medium leading-relaxed mt-0.5", isActive ? "text-gray-400" : "text-gray-400")}>
                    {section.desc}
                  </p>
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="activeGlow"
                    className="absolute -right-10 top-0 bottom-0 w-20 bg-white/5 blur-2xl rotate-12"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <div className="glass-card flex flex-col min-h-[600px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
            <div className="p-6 md:p-8 border-b border-outline flex items-center justify-between bg-gray-50/20">
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                  {settingsSections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Painel de Personalização Individual
                </p>
              </div>
              <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl border border-outline shadow-sm text-primary">
                 {(() => {
                   const Icon = settingsSections.find(s => s.id === activeSection)?.icon!;
                   return <Icon size={20} />;
                 })()}
              </div>
            </div>
            
            <div className="p-6 md:p-10 flex-1">
              {renderContent()}
            </div>

            <div className="p-6 md:p-8 bg-gray-50 border-t border-outline flex flex-col md:flex-row items-center justify-between gap-6 rounded-b-3xl">
              <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center md:text-left">
                 <AlertCircle size={14} className="text-amber-500 shrink-0" />
                 Algumas mudanças podem levar minutos para propagar.
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={handleDiscard}
                  className="flex-1 md:flex-none flex items-center gap-2 px-6 py-3 text-xs font-black text-gray-500 hover:bg-white rounded-xl transition-all border border-outline active:scale-95 justify-center"
                >
                  <RotateCcw size={16} /> <span className="hidden sm:inline">Descartar</span>
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn(
                    "flex-1 md:flex-none flex items-center gap-2 px-8 py-3 royal-gradient text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 min-w-[140px] md:min-w-[180px] justify-center",
                    isSaving && "opacity-70 cursor-not-allowed scale-95"
                  )}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} /> Salvar Tudo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
