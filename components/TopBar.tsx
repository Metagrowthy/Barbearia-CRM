'use client';

import React from 'react';
import { Bell, Search, PlusCircle, Settings, HelpCircle, ChevronDown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TopBarProps {
  onSearch?: (query: string) => void;
  onNewAppointment?: () => void;
  onNotificationClick?: () => void;
  onHelpClick?: () => void;
  onSettingsClick?: () => void;
  onProfileSettingsClick?: () => void;
  onMenuToggle?: () => void;
  shopName: string;
  shopLogo: string;
  layout?: 'modern' | 'classic';
  notifications?: any[];
  onMarkAllRead?: () => void;
  onLogout?: () => void;
  onHistoryClick?: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: 'owner' | 'employee';
}

export default function TopBar({ 
  onSearch, 
  onNewAppointment, 
  onNotificationClick, 
  onHelpClick, 
  onSettingsClick,
  onProfileSettingsClick,
  onMenuToggle,
  shopName,
  shopLogo,
  layout = 'modern',
  notifications = [],
  onMarkAllRead,
  onLogout,
  onHistoryClick,
  userName = 'Dono da Barbearia',
  userEmail = 'admin@barber.com',
  userRole = 'owner'
}: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
    if (!isProfileOpen) setIsNotificationsOpen(false);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) setIsProfileOpen(false);
  };

  return (
    <header className={cn(
      "h-16 bg-white/70 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-all duration-500",
      layout === 'modern' ? "mt-4 mx-2 md:mx-4 rounded-2xl md:rounded-3xl shadow-xl border border-white/20" : "border-b border-outline"
    )}>
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <Menu size={20} />
        </button>
        <div className="text-gray-400 hidden sm:block">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Busca..." 
          onChange={(e) => onSearch?.(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm py-1 w-full max-w-[200px] md:max-w-md focus:outline-hidden text-gray-900 placeholder:text-gray-400 transition-all font-medium"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={onNewAppointment}
            className="flex items-center gap-2 royal-gradient text-white px-3 md:px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 group"
          >
            <PlusCircle size={18} className="transition-transform group-hover:rotate-90 duration-300" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider hidden xs:block">Novo</span>
          </button>
        </div>

        <div className="h-6 w-[1px] bg-outline hidden sm:block" />

        <div className="flex items-center gap-2 md:gap-4 text-gray-500">
          <div className="relative">
            <button 
              onClick={handleNotificationsToggle}
              className={cn(
                "relative p-2 hover:bg-gray-100 rounded-xl transition-all",
                isNotificationsOpen && "bg-gray-100 text-primary shadow-inner"
              )}
            >
              <Bell size={20} />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-outline overflow-hidden z-30"
                  >
                    <div className="p-5 border-b border-outline bg-gray-50/50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">Notificações</h3>
                        <span className="text-[10px] font-bold text-gray-400 mt-0.5">{notifications.filter(n => n.unread).length} não lidas</span>
                      </div>
                      <button 
                        onClick={onMarkAllRead}
                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                      >
                        Lidas
                      </button>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-outline custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className={cn("p-5 hover:bg-gray-50 transition-colors cursor-pointer group relative", n.unread && "bg-primary/[0.02]")}>
                            <div className="flex justify-between items-start mb-1.5">
                              <span className={cn("text-[11px] font-black uppercase tracking-tight", n.unread ? "text-primary" : "text-gray-900")}>{n.title}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed group-hover:text-gray-700 transition-colors">{n.message}</p>
                            {n.unread && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tudo limpo por aqui!</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        onHistoryClick?.();
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full p-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 transition-all border-t border-outline flex items-center justify-center gap-2"
                    >
                       <PlusCircle size={14} /> Histórico Completo
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {userRole === 'owner' && (
            <button 
              onClick={onSettingsClick}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all hidden sm:block"
            >
              <Settings size={20} />
            </button>
          )}
        </div>

        <div className="relative">
          <div 
            onClick={handleProfileToggle}
            className={cn(
               "flex items-center gap-2 md:gap-3 pl-2 md:pl-4 py-1.5 cursor-pointer group rounded-2xl transition-all border border-transparent",
               isProfileOpen && "bg-gray-50 border-outline px-4"
            )}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white shadow-sm relative shrink-0">
              <Image 
                src={shopLogo} 
                alt="Profile" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col hidden xs:flex">
              <span className="text-xs font-black text-gray-900 leading-none truncate max-w-[120px] uppercase tracking-tighter">{shopName}</span>
              <span className="text-[10px] text-green-600 font-bold uppercase mt-1 tracking-[0.2em]">Online</span>
            </div>
            <ChevronDown size={14} className={cn("text-gray-400 group-hover:text-primary transition-all ml-1", isProfileOpen && "rotate-180")} />
          </div>

          <AnimatePresence mode="wait">
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl border border-outline p-2 z-30"
                >
                  <div className="p-3 border-b border-outline mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Logado como</p>
                    <p className="text-xs font-black text-gray-900">{userName}</p>
                    <p className="text-[10px] text-gray-500 font-bold truncate">{userEmail}</p>
                  </div>
                  
                  <div className="space-y-1">
                    {[
                      { icon: Settings, label: 'Configurações do Perfil', action: onProfileSettingsClick || onSettingsClick },
                      { icon: HelpCircle, label: 'Central de Ajuda', action: onHelpClick },
                    ].map((item) => (
                      <button 
                        key={item.label}
                        onClick={() => {
                          item.action?.();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-primary transition-all"
                      >
                        <item.icon size={16} />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-outline">
                    <button 
                      onClick={() => {
                        onLogout?.();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
                    >
                      <div className="rotate-180"><PlusCircle size={16} /></div>
                      Sair do Sistema
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
