'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Settings, 
  LogOut,
  ChevronRight,
  Bell,
  History,
  DollarSign,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-md transition-all duration-200 group",
        active 
          ? "bg-primary text-white shadow-md shadow-primary/20" 
          : "text-gray-500 hover:bg-gray-100 hover:text-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={cn(active ? "text-white" : "text-gray-400 group-hover:text-primary")} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {active && <ChevronRight size={16} />}
    </button>
  );
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  shopName: string;
  shopLogo: string;
  userName?: string;
  userRole?: 'owner' | 'employee';
  layout?: 'modern' | 'classic';
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  shopName, 
  shopLogo, 
  userName = 'John Doe',
  userRole = 'owner',
  layout = 'modern',
  isOpen = false,
  onClose,
  onLogout
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'calendar', icon: Calendar, label: 'Agenda', roles: ['owner', 'employee'] },
    { id: 'clients', icon: Users, label: 'Clientes', roles: ['owner', 'employee'] },
    { id: 'financial', icon: DollarSign, label: 'Controle Financeiro', roles: ['owner'] },
    { id: 'history', icon: History, label: 'Histórico', roles: ['owner', 'employee'] },
    { id: 'services', icon: Layers, label: 'Serviços', roles: ['owner'] },
    { id: 'settings', icon: Settings, label: 'Configurações', roles: ['owner'] },
  ];

  const filteredItems = navItems.filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 transition-opacity" 
          onClick={onClose}
        />
      )}

      <div className={cn(
        "fixed lg:relative lg:flex flex-col p-4 z-40 transition-all duration-500 w-64 h-full bg-white overflow-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        layout === 'modern' 
          ? "lg:m-4 lg:rounded-3xl shadow-2xl border-r lg:border border-white/20 bg-white/90 backdrop-blur-md" 
          : "border-r border-outline shadow-sm"
      )}>
        {layout === 'modern' && (
          <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        )}
        <div className="flex items-center justify-between px-2 mb-10 mt-2">
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-outline relative shadow-md">
              <Image 
                src={shopLogo} 
                alt="Logo" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center w-full">
              <h1 className="font-black text-gray-900 leading-none truncate text-base uppercase tracking-tight">{shopName}</h1>
            </div>
          </div>
          {/* Mobile close button moved to top right if open */}
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {filteredItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose?.();
              }}
            />
          ))}
        </nav>

      <div className="pt-4 border-t border-outline">
        <SidebarItem icon={LogOut} label="Sair" onClick={onLogout} />
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black shadow-sm">
            {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-900 truncate">{userName}</p>
            <p className="text-[10px] text-muted-theme font-bold uppercase tracking-tight">
              {userRole === 'owner' ? 'Dono / Administrador' : 'Funcionário'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);
}
