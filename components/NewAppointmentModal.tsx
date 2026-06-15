'use client';

import React from 'react';
import { X, Calendar, Clock, User, Phone, Scissors, DollarSign, CheckCircle2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { getNicheConfig } from '@/lib/niches';

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  barbersList?: any[];
  servicesList?: any[];
  inventoryList?: any[];
  businessHours?: any[];
  clientsList?: any[];
  appointments?: any[];
  establishmentId?: string;
  niche?: string;
}

export default function NewAppointmentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  barbersList, 
  servicesList = [], 
  inventoryList = [],
  businessHours = [],
  clientsList = [],
  appointments = [],
  establishmentId,
  niche = 'barbershop'
}: NewAppointmentModalProps) {
  const nicheCfg = getNicheConfig(niche);
  const employeeLabel = nicheCfg.employeeLabelSingular;
  const employeeLabelPlural = nicheCfg.employeeLabelPlural;
  const ServiceIcon = nicheCfg.icon;

  const [step, setStep] = React.useState(1);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    barber: '',
    selectedServices: [] as number[],
    selectedProducts: [] as { id: number, quantity: number }[],
    date: getLocalDateString(new Date()),
    time: '',
    clientId: '' as string | undefined
  });

  const defaultBarbersList = ["Rodrigo (Sênior)", "Lucas (Júnior)", "Matheus (Freelance)"];
  const optionsBarbers = barbersList ? barbersList.map(b => b.name) : defaultBarbersList;

  const [showExtraHours, setShowExtraHours] = React.useState(false);
  const [additionalPrice, setAdditionalPrice] = React.useState<number>(0);

  // Calculate total duration needed for selected services
  const totalDuration = React.useMemo(() => {
    return servicesList
      .filter(s => formData.selectedServices.includes(s.id))
      .reduce((sum, s) => sum + (s.durationMinutes || parseInt(s.duration?.replace(/\D/g, '') || '30')), 0) || 30;
  }, [servicesList, formData.selectedServices]);

  // Derived time slots based on business hours and overlapping appointments
  const availableTimeSlots = React.useMemo(() => {
    const date = new Date(formData.date + 'T12:00:00');
    const dayOfWeek = date.getDay();
    const hours = businessHours?.find(h => Number(h.day_of_week) === dayOfWeek || Number(h.day) === dayOfWeek);

    if (!hours || String(hours.is_closed) === 'true' || hours.is_closed === true) {
      return [];
    }

    const openTime = hours.open_time || '08:00';
    const closeTime = hours.close_time || '19:00';

    const slots = [];
    const [startH, startM] = openTime.split(':').map(Number);
    let [endH, endM] = closeTime.split(':').map(Number);

    if (showExtraHours) {
      endH = 23;
      endM = 30;
    }

    // Get occupied ranges for the selected barber on this date
    const barberApts = (appointments || []).filter(a => a.barber === formData.barber && a.date === formData.date && a.status !== 'cancelado');
    const occupiedRanges = barberApts.map(a => {
      const [h, m] = (a.time || '00:00').split(':').map(Number);
      const startMins = h * 60 + m;
      const endMins = startMins + (a.durationMinutes || 45);
      return { start: startMins, end: endMins };
    });

    const now = new Date();
    const isToday = formData.date === getLocalDateString(now);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let currentH = startH;
    let currentM = startM;

    while (currentH < endH || (currentH === endH && currentM < endM)) {
      const slotMins = currentH * 60 + currentM;
      const slotEndMins = slotMins + totalDuration;

      // Filter out overlapping slots
      const overlaps = occupiedRanges.some(range => {
        return slotMins < range.end && slotEndMins > range.start;
      });

      if (!overlaps) {
        slots.push(`${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
      }

      currentM += 30;
      if (currentM >= 60) {
        currentH += 1;
        currentM -= 60;
      }
    }

    return slots;
  }, [formData.date, formData.barber, formData.selectedServices, businessHours, appointments, showExtraHours, servicesList]);

  const totalPrice = React.useMemo(() => {
    const servicesTotal = servicesList
      .filter(s => formData.selectedServices.includes(s.id))
      .reduce((sum, s) => sum + (parseFloat(s.price?.toString().replace(',', '.') || '0')), 0);
    
    const productsTotal = inventoryList
      .filter(p => formData.selectedProducts.find(sp => sp.id === p.id))
      .reduce((sum, p) => {
        const item = formData.selectedProducts.find(sp => sp.id === p.id);
        const price = parseFloat(p.price?.toString().replace(',', '.') || '0');
        return sum + (price * (item?.quantity || 0));
      }, 0);

    return servicesTotal + productsTotal;
  }, [formData.selectedServices, formData.selectedProducts, servicesList, inventoryList]);

  const toggleService = (id: any) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(id)
        ? prev.selectedServices.filter(sid => sid !== id)
        : [...prev.selectedServices, id]
    }));
  };

  const updateProductQuantity = (id: any, delta: number) => {
    setFormData(prev => {
      const existing = prev.selectedProducts.find(p => p.id === id);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return { ...prev, selectedProducts: prev.selectedProducts.filter(p => p.id !== id) };
        }
        return {
          ...prev,
          selectedProducts: prev.selectedProducts.map(p => p.id === id ? { ...p, quantity: newQty } : p)
        };
      } else if (delta > 0) {
        return { ...prev, selectedProducts: [...prev.selectedProducts, { id, quantity: 1 }] };
      }
      return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryServiceId = formData.selectedServices[0];
    const serviceObj = servicesList.find(s => s.id === primaryServiceId);
    
    // Get full objects for IDs
    const selectedBarberObj = barbersList?.find(b => b.name === formData.barber);

    onSuccess({ 
      ...formData, 
      totalPrice,
      additionalPrice: Number(additionalPrice),
      serviceId: serviceObj?.id,
      serviceName: serviceObj?.name || "Atendimento Vário",
      durationMinutes: totalDuration,
      barberId: selectedBarberObj?.id,
      establishmentId,
      clientId: formData.clientId
    });
    setStep(3);
    setTimeout(() => {
      onClose();
      setStep(1);
      setFormData({ name: '', phone: '', barber: '', selectedServices: [], selectedProducts: [], date: getLocalDateString(new Date()), time: '', clientId: undefined });
      setAdditionalPrice(0);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-outline flex items-center justify-between bg-gray-50/50 flex-none">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-none">Novo Atendimento</h2>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">Serviços e Consumo para Walk-in</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <User size={14} className="text-primary" /> Nome do Cliente *
                      </span>
                      <div className="relative">
                        <input 
                          required
                          type="text" 
                          placeholder="Ex: Arthur Morgan"
                          value={formData.name}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(p => ({ ...p, name: val, clientId: undefined }));
                            if (val.length > 1) {
                              const filtered = clientsList.filter(c => 
                                c.name.toLowerCase().includes(val.toLowerCase()) ||
                                c.phone.includes(val)
                              ).slice(0, 5);
                              setSuggestions(filtered);
                            } else {
                              setSuggestions([]);
                            }
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition-all font-medium"
                        />
                        <AnimatePresence>
                          {suggestions.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-60 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-outline overflow-hidden"
                            >
                              {suggestions.map(s => (
                                <button
                                  key={s.id || s.phone}
                                  type="button"
                                  onClick={() => {
                                    setFormData(p => ({ ...p, name: s.name, phone: s.phone || '', clientId: s.id }));
                                    setSuggestions([]);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-outline last:border-0"
                                >
                                  <div>
                                    <p className="text-xs font-black text-gray-900">{s.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold tracking-tight">{s.phone}</p>
                                  </div>
                                  <div className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full">Existente</div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Phone size={14} className="text-primary" /> Telefone / WhatsApp *
                      </span>
                      <input 
                        required
                        type="tel" 
                        maxLength={14}
                        placeholder="Ex: 19993644604 ou +5519993644604"
                        value={formData.phone}
                        onChange={e => {
                          // Allow digits and '+'
                          const val = e.target.value.replace(/[^\d+]/g, '');
                          setFormData(p => ({ ...p, phone: val }))
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition-all font-medium"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Insira o número com DDD (11 dígitos ou com +55 no início).</p>
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <User size={14} className="text-primary" /> {employeeLabel} *
                      </span>
                      <select
                        required
                        value={formData.barber}
                        onChange={e => setFormData(p => ({ ...p, barber: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-outline rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition-all font-medium text-gray-900 appearance-none"
                      >
                        <option value="" disabled>Selecione um(a) {employeeLabel.toLowerCase()}</option>
                        {optionsBarbers.map(barber => (
                          <option key={barber} value={barber}>{barber}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="button"
                      disabled={!formData.name || !/^(?:\+?55)?\d{11}$/.test(formData.phone) || !formData.barber}
                      onClick={() => setStep(2)}
                      className="w-full royal-gradient text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Próximo: Selecionar Itens
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-8">
                    {/* Services Section */}
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <ServiceIcon size={14} className="text-primary animate-pulse" /> {nicheCfg.id === 'vet_pet' ? 'Serviços & Banhos' : 'Serviços'} Disponíveis
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {servicesList.map(s => {
                          const isSelected = formData.selectedServices.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleService(s.id)}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all relative group",
                                isSelected 
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20" 
                                  : "bg-white border-outline hover:border-primary/30"
                              )}
                            >
                              <p className="text-xs font-bold truncate">{s.name}</p>
                              <p className={cn("text-[10px] mt-1 font-medium", isSelected ? "text-blue-100" : "text-gray-400")}>
                                  R$ {s.price},00 • {s.category || 'Serviço'}
                              </p>
                              {isSelected && <CheckCircle2 size={12} className="absolute top-2 right-2 text-white" />}
                            </button>
                          );
                        })}
                        {servicesList.length === 0 && (
                          <div className="col-span-2 p-4 text-center text-xs text-gray-400 italic">
                            Nenhum serviço carregado do banco.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consumption Section */}
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <ShoppingBag size={14} className="text-primary" /> Consumo e Produtos
                      </span>
                      <div className="space-y-2">
                        {inventoryList.map(p => {
                          const selection = formData.selectedProducts.find(sp => sp.id === p.id);
                          const qty = selection?.quantity || 0;
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                "p-3 rounded-xl border flex items-center justify-between transition-all",
                                qty > 0 ? "bg-blue-50 border-primary/20" : "bg-white border-outline"
                              )}
                            >
                              <div>
                                 <p className="text-xs font-bold text-gray-900">{p.name}</p>
                                 <p className="text-[10px] text-gray-500 font-medium">R$ {p.price},00 • {p.category || p.type}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <button 
                                   type="button"
                                   onClick={() => updateProductQuantity(p.id, -1)}
                                   className="w-6 h-6 rounded-lg bg-white border border-outline flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                 >
                                   <Minus size={12} />
                                 </button>
                                 <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                 <button 
                                   type="button"
                                   onClick={() => updateProductQuantity(p.id, 1)}
                                   className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-dark shadow-sm"
                                 >
                                   <Plus size={12} />
                                 </button>
                              </div>
                            </div>
                          );
                        })}
                        {inventoryList.length === 0 && (
                          <div className="p-4 text-center text-xs text-gray-400 italic">
                            Catálogo de produtos indisponível.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Day and Time Section */}
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <Calendar size={14} className="text-primary" /> Data do Agendamento
                      </span>
                      <div className="grid grid-cols-7 gap-1 text-center mb-6">
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() + i);
                          const dayOfWeekIndex = date.getDay();
                          const dayOfMonth = date.getDate().toString();
                          const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
                          const weekday = weekdays[dayOfWeekIndex];
                          const dateString = getLocalDateString(date);
                          
                          return (
                            <div key={i} className="flex flex-col gap-1 items-center">
                              <span className="text-[10px] font-bold text-gray-400">{weekday}</span>
                              <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, date: dateString }))}
                                className={cn(
                                  "py-2 w-full rounded-lg text-xs font-bold transition-all border",
                                  formData.date === dateString
                                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                    : "bg-gray-50 border-outline text-gray-600 hover:bg-gray-100"
                                )}
                              >
                                {dayOfMonth}
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} className="text-primary" /> Horário
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowExtraHours(!showExtraHours)}
                          className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-colors", showExtraHours ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}
                        >
                          {showExtraHours ? 'Ocultar Extras' : 'Horários Extras'}
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {availableTimeSlots.map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, time }))}
                            className={cn(
                              "py-2 rounded-lg border text-[11px] font-black transition-all",
                              formData.time === time 
                                ? "bg-primary border-primary text-white" 
                                : "bg-gray-50 border-outline text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                        {availableTimeSlots.length === 0 && (
                          <div className="col-span-4 p-4 text-center text-xs text-amber-600 font-bold bg-amber-50 rounded-xl">
                            Nenhum horário disponível nesta data.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Value Section */}
                    <div className="bg-primary/[0.02] p-4 rounded-xl border border-primary/10 mt-6">
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-primary" /> Valor Adicional (Gorjeta / Extra)
                      </span>
                      <p className="text-[10px] text-gray-500 font-medium mb-3 leading-relaxed">
                        Caso o cliente pague um valor extra (gorjeta, caixinha ou adicional), insira abaixo para bater com o fluxo de caixa.
                      </p>
                      <div className="relative max-w-[160px]">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">R$</span>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={additionalPrice || ''} 
                          onChange={e => setAdditionalPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-outline rounded-xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Floating Bar */}
                  <div className="sticky bottom-0 bg-white pt-4 pb-0 border-t border-outline -mx-8 px-8 mt-auto z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center justify-between sm:block">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total <span className="hidden sm:inline">do Atendimento</span></p>
                        <p className="text-xl font-black text-primary">R$ {totalPrice + Number(additionalPrice)},00</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                        >
                          Voltar
                        </button>
                        <button 
                          type="submit"
                          disabled={formData.selectedServices.length === 0 || !formData.date || !formData.time}
                          className="flex-[2] sm:flex-none px-4 sm:px-8 py-3 royal-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                          Finalizar Tudo
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-100 shadow-sm relative">
                    <CheckCircle2 size={48} />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-green-500 rounded-full"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Tudo Pronto!</h3>
                  <p className="text-sm text-gray-500 font-medium max-w-[280px] leading-relaxed">
                    O atendimento de <strong>{formData.name}</strong> foi registrado. 
                    <br />Total: R$ {totalPrice + Number(additionalPrice)},00 agendado para as {formData.time}.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
