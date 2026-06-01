'use client';

import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  onNewAppointment?: () => void;
  appointments?: any[];
  barbersList?: any[];
  userProfile?: any;
  businessHours?: any[];
}

export default function CalendarView({ onNewAppointment, appointments: externalAppointments, barbersList, userProfile, businessHours }: CalendarViewProps) {
  const today = new Date();
  const [currentView, setCurrentView] = React.useState('Dia');
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth()); 
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = React.useState(today.getDate());

  React.useEffect(() => {
    console.log("⚡ [Agenda Debug] Agendamentos recebidos na tela:", externalAppointments);
    console.log("⚡ [Agenda Debug] Barbeiros ativos:", barbersList);
  }, [externalAppointments, barbersList]);

  const defaultBarbers = [
    { name: 'Rodrigo (Sênior)', color: 'bg-primary' },
    { name: 'Lucas (Júnior)', color: 'bg-indigo-400' },
    { name: 'Matheus (Freelance)', color: 'bg-green-400' },
  ];

  const barbers = React.useMemo(() => {
    const list = barbersList || defaultBarbers;
    // Se for um funcionário logado, filtra para mostrar apenas ele mesmo
    if (userProfile?.role === 'employee' && userProfile?.full_name) {
      return list.filter((b: any) => b.name === userProfile.full_name);
    }
    return list;
  }, [barbersList, userProfile]);
  
  const [selectedBarbers, setSelectedBarbers] = React.useState<string[]>([]);

  // Effect to initialize selected barbers once the list is loaded
  const hasInitializedBarbers = React.useRef(false);
  React.useEffect(() => {
    if (barbers.length > 0 && !hasInitializedBarbers.current) {
      setSelectedBarbers(barbers.map(b => b.name));
      hasInitializedBarbers.current = true;
    }
  }, [barbers]);

  // Calculate the 7 dates of the week of selectedDay
  const weekDates = React.useMemo(() => {
    const selectedDate = new Date(currentYear, currentMonth, selectedDay);
    const dayOfWeek = selectedDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentYear, currentMonth, selectedDay);
      d.setDate(d.getDate() + diffToMonday + i);
      dates.push(d);
    }
    return dates;
  }, [currentYear, currentMonth, selectedDay]);

  const activeBarberName = selectedBarbers[0] || (barbers[0] && barbers[0].name);

  const defaultAppointments = [
    { id: 1, client: "Arthur Morgan", service: "Corte + Barba", barber: "Rodrigo (Sênior)", time: "09:00", durationMinutes: 45, day: 22, colorClass: "bg-primary/10 border-primary text-primary" },
    { id: 2, client: "John Marston", service: "Corte Máquina", barber: "Lucas (Júnior)", time: "11:00", durationMinutes: 30, day: 22, colorClass: "bg-indigo-50 border-indigo-400 text-indigo-700" },
    { id: 3, client: "Sadie Adler", service: "Corte Feminino", barber: "Matheus (Freelance)", time: "14:00", durationMinutes: 60, day: 22, colorClass: "bg-green-50 border-green-400 text-green-700" },
    { id: 4, client: "Charles Smith", service: "Hidratação", barber: "Rodrigo (Sênior)", time: "16:00", durationMinutes: 45, day: 22, colorClass: "bg-primary/10 border-primary text-primary" },
  ];

  const activeAppointments = externalAppointments || defaultAppointments;

  const currentFormattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const toggleBarber = (name: string) => {
    setSelectedBarbers(prev => 
      prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]
    );
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => `empty-${i}`);
  const days = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1);

  const timeSlots = React.useMemo(() => {
    const defaultSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
    if (!businessHours || businessHours.length === 0) {
      return defaultSlots;
    }

    let startHour = 8;
    let endHour = 19;
    let foundRange = false;

    if (currentView === 'Dia') {
      const selectedDate = new Date(currentYear, currentMonth, selectedDay);
      const dayOfWeek = selectedDate.getDay();
      const dayConfig = businessHours.find((h: any) => Number(h.day_of_week) === dayOfWeek || Number(h.day) === dayOfWeek);
      
      if (dayConfig && !dayConfig.is_closed && dayConfig.open_time && dayConfig.close_time) {
        const [openH] = dayConfig.open_time.split(':').map(Number);
        const [closeH] = dayConfig.close_time.split(':').map(Number);
        if (openH < closeH) {
          startHour = openH;
          endHour = closeH;
          foundRange = true;
        } else if (openH === closeH) {
          startHour = openH;
          endHour = openH;
          foundRange = true;
        }
      }
    }

    // If not found (or in Week view, or Day view of a closed day), calculate the union of all open days
    if (!foundRange) {
      const openDays = businessHours.filter((h: any) => !h.is_closed && h.open_time && h.close_time);
      if (openDays.length > 0) {
        let earliest = 24;
        let latest = 0;
        openDays.forEach((h: any) => {
          const openH = parseInt(h.open_time.split(':')[0], 10);
          const closeH = parseInt(h.close_time.split(':')[0], 10);
          if (openH < earliest) earliest = openH;
          if (closeH > latest) latest = closeH;
        });
        if (earliest <= latest) {
          startHour = earliest;
          endHour = latest;
          foundRange = true;
        }
      }
    }

    if (!foundRange) {
      return defaultSlots;
    }

    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots.length > 0 ? slots : defaultSlots;
  }, [businessHours, currentView, currentYear, currentMonth, selectedDay]);

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handlePrev = () => {
    const activeDate = new Date(currentYear, currentMonth, selectedDay);
    if (currentView === 'Dia') {
      activeDate.setDate(activeDate.getDate() - 1);
    } else {
      activeDate.setDate(activeDate.getDate() - 7);
    }
    setCurrentYear(activeDate.getFullYear());
    setCurrentMonth(activeDate.getMonth());
    setSelectedDay(activeDate.getDate());
  };

  const handleNext = () => {
    const activeDate = new Date(currentYear, currentMonth, selectedDay);
    if (currentView === 'Dia') {
      activeDate.setDate(activeDate.getDate() + 1);
    } else {
      activeDate.setDate(activeDate.getDate() + 7);
    }
    setCurrentYear(activeDate.getFullYear());
    setCurrentMonth(activeDate.getMonth());
    setSelectedDay(activeDate.getDate());
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 md:p-8 max-w-7xl mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Agenda <CalendarIcon size={20} className="text-primary" />
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Gerencie seus horários e agendamentos com facilidade.</p>
          </div>
          
          {/* Navigation Arrows for Day/Week */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-outline shadow-xs self-start md:self-center mt-2 md:mt-0">
            <button 
              onClick={handlePrev}
              title={currentView === 'Dia' ? "Dia Anterior" : "Semana Anterior"}
              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-90"
            >
              <ChevronLeft size={18} className="stroke-[2.5]" />
            </button>
            <button 
              onClick={handleNext}
              title={currentView === 'Dia' ? "Próximo Dia" : "Próxima Semana"}
              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-90"
            >
              <ChevronRight size={18} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-outline shadow-xs">
            {['Dia', 'Semana'].map((label) => (
              <button 
                key={label}
                onClick={() => setCurrentView(label)}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  currentView === label ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button 
            onClick={onNewAppointment}
            className="flex items-center justify-center gap-2 royal-gradient text-white px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
          >
            <PlusCircle size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Novo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">{months[currentMonth]} {currentYear}</h3>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <span key={`${d}-${i}`} className="text-[10px] font-bold text-gray-400">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {emptyDays.map(k => (
                <div key={k} />
              ))}
              {days.map(d => (
                <button 
                  key={d} 
                  onClick={() => setSelectedDay(d)}
                  className={`text-xs py-2 rounded-md transition-all ${
                    d === selectedDay 
                      ? 'bg-primary text-white font-bold shadow-sm' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Funcionários</h3>
            <div className="flex flex-col gap-3">
              {barbers.map((b) => (
                <label key={b.name} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full transition-transform group-hover:scale-125", b.color)} />
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      selectedBarbers.includes(b.name) ? "text-gray-900" : "text-gray-400"
                    )}>{b.name}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={selectedBarbers.includes(b.name)}
                    onChange={() => toggleBarber(b.name)}
                    className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-outline bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                {selectedDay} de {months[currentMonth]} de {currentYear}
              </h2>
              {currentView === 'Dia' && selectedBarbers.length > 1 && (
                <p className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-full uppercase tracking-wider">
                  Visualização Multi-Coluna Ativa
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <div className={cn(
                "min-w-[900px] lg:min-w-0",
                (currentView === 'Dia' || currentView === 'Semana') && "flex flex-col"
              )}>
                {/* Header for Barbers in Dia view */}
                {currentView === 'Dia' && (
                  <div className="flex border-b border-outline bg-gray-50/30">
                    <div className="w-20 shrink-0 border-r border-outline sticky left-0 z-20 bg-gray-50" />
                    {barbers.filter(b => selectedBarbers.includes(b.name)).map(barber => (
                      <div key={barber.name} className="flex-1 p-3 text-center border-r border-outline last:border-r-0">
                        <div className="flex items-center justify-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", barber.color)} />
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-700">{barber.name.split(' (')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Header for Days in Semana view */}
                {currentView === 'Semana' && (
                  <div className="flex border-b border-outline bg-gray-50/30">
                    <div className="w-20 shrink-0 border-r border-outline flex flex-col items-center justify-center p-2 bg-gray-50 sticky left-0 z-20">
                      {activeBarberName && (
                        <>
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none text-center">Profissional</span>
                          <span className="text-[9px] font-black text-primary truncate max-w-full mt-1 text-center">{activeBarberName.split(' ')[0]}</span>
                        </>
                      )}
                    </div>
                    {(() => {
                      const weekDaysLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                      return weekDates.map((dateObj, idx) => {
                        const isToday = dateObj.toDateString() === new Date().toDateString();
                        const dayLabel = weekDaysLabels[idx];
                        const dayNum = dateObj.getDate();
                        const monthNum = String(dateObj.getMonth() + 1).padStart(2, '0');
                        
                        return (
                          <div key={idx} className={cn(
                            "flex-1 p-2 text-center border-r border-outline last:border-r-0 flex flex-col justify-center",
                            isToday && "bg-primary/5"
                          )}>
                            <span className={cn(
                              "block text-[10px] font-black uppercase tracking-wider",
                              isToday ? "text-primary" : "text-gray-500"
                            )}>
                              {dayLabel}
                            </span>
                            <span className={cn(
                              "block text-xs font-black mt-0.5",
                              isToday ? "text-primary" : "text-gray-700"
                            )}>
                              {dayNum}/{monthNum}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                <div className="divide-y divide-outline">
                  {timeSlots.map((time) => (
                    <div key={time} className="flex min-h-[80px] group">
                      <div className="w-20 p-4 border-r border-outline text-[11px] font-bold text-gray-400 bg-gray-50 shrink-0 flex items-center justify-center sticky left-0 z-20">
                        {time}
                      </div>
                      
                      {currentView === 'Dia' ? (
                        // Individual Columns for each selected barber
                        barbers.filter(b => selectedBarbers.includes(b.name)).map(barber => {
                          const app = activeAppointments.find(a => {
                            if (!a.time || typeof a.time !== 'string') return false;
                            
                            // Check if the appointment falls in this block's hour (e.g. 14:30 belongs in 14:00 slot)
                            const appHour = a.time?.split(':')[0];
                            const slotHour = time.split(':')[0];
                            
                            if (appHour !== slotHour) return false;
                            
                            // Check full date alignment
                            if (a.fullDate) {
                              if (a.fullDate !== currentFormattedDate) return false;
                            } else if (a.day !== selectedDay) { // Fallback for old mock data
                              return false;
                            }

                            if (!a.barber) return false; // Prevent empty string matching
                            
                            const isExactName = a.barber === barber.name;
                            const isIncluded = barber.name.toLowerCase().includes(a.barber.toLowerCase());
                            const reverseMatch = a.barber.toLowerCase().includes(barber.name.split(' ')[0].toLowerCase());
                            
                            return isExactName || isIncluded || reverseMatch;
                          });

                          return (
                            <div key={`${time}-${barber.name}`} className="flex-1 p-2 relative border-r border-outline last:border-r-0 group/slot">
                              <AnimatePresence>
                                {app ? (
                                  <motion.div 
                                    key={app.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={cn(
                                      "absolute inset-2 border-l-4 rounded-md p-2 shadow-sm z-10 flex flex-col justify-center",
                                      app.colorClass
                                    )}
                                  >
                                    <div className="flex justify-between items-start mb-0.5">
                                      <p className="text-[11px] font-extrabold truncate max-w-[70%]">{app.client}</p>
                                      <span className="text-[9px] font-black opacity-60 bg-black/5 px-1 rounded">
                                        {app.durationMinutes}m
                                      </span>
                                    </div>
                                    <p className="text-[10px] opacity-90 font-bold truncate mb-0.5">{app.service}</p>
                                    <p className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                                      {app.time} às {calculateEndTime(app.time, app.durationMinutes || 0)}
                                    </p>
                                  </motion.div>
                                ) : (
                                  <div 
                                    onClick={onNewAppointment}
                                    className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 bg-emerald-50/50 cursor-pointer flex flex-col items-center justify-center transition-all border-2 border-dashed border-transparent hover:border-emerald-200 m-1 rounded-lg"
                                  >
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Livre</span>
                                    <PlusCircle size={14} className="mt-1 text-emerald-500" />
                                  </div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      ) : currentView === 'Semana' ? (
                        // 7 Columns representing Seg to Dom for the first selected barber
                        selectedBarbers.length === 0 ? (
                          <div className="flex-1 p-4 text-center text-xs font-bold text-gray-400 flex items-center justify-center">
                            Selecione um funcionário na lateral para visualizar a agenda semanal.
                          </div>
                        ) : (
                          weekDates.map((dateObj, idx) => {
                            const colDateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                            const isToday = dateObj.toDateString() === new Date().toDateString();

                            const app = activeAppointments.find(a => {
                              if (!a.time || typeof a.time !== 'string') return false;
                              
                              // Check hour
                              const appHour = a.time.split(':')[0];
                              const slotHour = time.split(':')[0];
                              if (appHour !== slotHour) return false;
                              
                              // Check date
                              if (a.fullDate) {
                                if (a.fullDate !== colDateString) return false;
                              } else {
                                if (a.day !== dateObj.getDate()) return false;
                              }
                              
                              if (!a.barber) return false;
                              
                              const isExactName = a.barber === activeBarberName;
                              const isIncluded = activeBarberName.toLowerCase().includes(a.barber.toLowerCase());
                              const reverseMatch = a.barber.toLowerCase().includes(activeBarberName.split(' ')[0].toLowerCase());
                              
                              return isExactName || isIncluded || reverseMatch;
                            });

                            return (
                              <div key={idx} className={cn(
                                "flex-1 p-1 relative border-r border-outline last:border-r-0 group/slot",
                                isToday && "bg-primary/2"
                              )}>
                                <AnimatePresence>
                                  {app ? (
                                    <motion.div 
                                      key={app.id}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className={cn(
                                        "absolute inset-1 border-l-4 rounded-md p-1.5 shadow-xs z-10 flex flex-col justify-center overflow-hidden",
                                        app.colorClass
                                      )}
                                    >
                                      <div className="flex justify-between items-start mb-0.5">
                                        <p className="text-[10px] font-extrabold truncate max-w-full leading-tight">{app.client}</p>
                                      </div>
                                      <p className="text-[9px] opacity-90 font-bold truncate leading-none mb-0.5">{app.service}</p>
                                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-70 leading-none">
                                        {app.time}
                                      </p>
                                    </motion.div>
                                  ) : (
                                    <div 
                                      onClick={onNewAppointment}
                                      className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 bg-emerald-50/50 cursor-pointer flex flex-col items-center justify-center transition-all border border-dashed border-transparent hover:border-emerald-200 m-0.5 rounded-lg"
                                    >
                                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">Livre</span>
                                      <PlusCircle size={12} className="mt-0.5 text-emerald-500" />
                                    </div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        )
                      ) : (
                        // Standard view for Month / Other
                        <div className="flex-1 p-2 relative">
                          {/* Fallback */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
