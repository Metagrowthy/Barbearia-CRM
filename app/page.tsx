'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import KPIStats from '@/components/KPIStats';
import AppointmentsTable from '@/components/AppointmentsTable';
import RecentClients from '@/components/RecentClients';
import CalendarView from '@/components/CalendarView';
import ClientsView from '@/components/ClientsView';
import HistoryView from '@/components/HistoryView';
import ServicesView from '@/components/ServicesView';
import SettingsView from '@/components/SettingsView';
import NotificationsView from '@/components/NotificationsView';
import FinanceView from '@/components/FinanceView';
import NewAppointmentModal from '@/components/NewAppointmentModal';
import AuthView from '@/components/AuthView';
import LockedScreen from '@/components/LockedScreen';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Scissors, Calendar, Users, Briefcase, Zap } from 'lucide-react';

import { getSupabase } from '@/lib/supabase';
import { createInitialTenantProfile, createEmployeeAccount } from '@/app/actions';

interface InventoryItem {
  id: string | number;
  name: string;
  price: number;
  category: string;
  duration?: string;
  stock?: number;
  type?: 'drink' | 'supply';
}

interface UserProfile {
  id: string;
  establishment_id: string;
  role: 'owner' | 'employee';
  full_name: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoadingSession, setIsLoadingSession] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [sessionEmail, setSessionEmail] = React.useState<string>('admin@barber.com');
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [financeTab, setFinanceTab] = React.useState<'overview' | 'flow' | 'commissions' | 'inventory'>('overview');
  const [servicesTab, setServicesTab] = React.useState<'services' | 'drinks' | 'supplies'>('services');
  const [settingsSection, setSettingsSection] = React.useState<string>('profile');
  const [timeRange, setTimeRange] = React.useState('Hoje');
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [notification, setNotification] = React.useState<string | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setIsSuccess(true);
      }
    }
  }, []);

  // Auth Session Check
  React.useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setIsLoadingSession(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        if (session.user?.email) {
          setSessionEmail(session.user.email);
        }
        // Fetch User Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile as UserProfile);
        } else if (session.user.user_metadata?.shop_name) {
          // If profile doesn't exist, create both Establishment and Profile (Only for Owners who just signed up)
          const fullName = session.user.user_metadata?.full_name || 'Dono';
          const shopName = session.user.user_metadata?.shop_name || 'Minha Barbearia';
          
          const result = await createInitialTenantProfile(session.user.id, fullName, shopName, session.user.user_metadata?.cnpj);
          
          if (result.success && result.profile) {
            setUserProfile(result.profile as UserProfile);
          } else {
             console.error("Erro ao criar Establishment via Server Action:", result.error);
             alert(`Erro crítico: Estabelecimento não criado. Supabase error: ${result.error}`);
          }
        } else {
          console.warn("Usuário logado não possui perfil e não informou nome da barbearia no cadastro (provável funcionário aguardando convite).");
        }
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        setIsAuthenticated(!!session);
        if (session) {
          if (session.user?.email) {
            setSessionEmail(session.user.email);
          }
          const { data: profile } = await (supabase
            .from('profiles' as any) as any)
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUserProfile(profile as UserProfile);
          } else if (session.user.user_metadata?.shop_name) {
            // Self-correction for profiles
            const fullName = session.user.user_metadata?.full_name || 'Dono';
            const shopName = session.user.user_metadata?.shop_name || 'Minha Barbearia';
            
            const result = await createInitialTenantProfile(session.user.id, fullName, shopName, session.user.user_metadata?.cnpj);
            if (result.success && result.profile) {
               setUserProfile(result.profile as UserProfile);
            } else {
               console.error("Erro ao criar establishment no reload:", result.error);
               alert("Erro criar establishment: " + result.error);
            }
          } else {
            console.warn("Sessão alterada: Usuário sem perfil e sem shop_name.");
          }
        } else {
          setUserProfile(null);
        }
      });

      setIsLoadingSession(false);

      return () => subscription.unsubscribe();
    };

    checkSession();
  }, []);

  // Inventory State (Lifted from ServicesView)
  const [drinks, setDrinks] = React.useState<InventoryItem[]>([
    { id: 101, name: "Cerveja Stella Artois", price: 12.00, category: "Cerveja", stock: 24 },
    { id: 102, name: "Coca-Cola 350ml", price: 6.50, category: "Refrigerante", stock: 15 },
    { id: 103, name: "Água Mineral", price: 4.00, category: "Água", stock: 30 },
  ]);

  const [supplies, setSupplies] = React.useState<InventoryItem[]>([
    { id: 201, name: "Pomada Modeladora Matte", price: 45.00, category: "Cabelo", stock: 2 }, 
    { id: 202, name: "Minoxidil 5% (Frasco)", price: 85.00, category: "Barba", stock: 8 },
    { id: 203, name: "Creme de Barbear Premium", price: 35.00, category: "Barba", stock: 10 },
  ]);

  // Services State
  const [services, setServices] = React.useState<any[]>([
    { id: 1, name: "Corte Masculino", durationMinutes: 45, price: 60.00, category: "Cabelo" },
    { id: 2, name: "Barba Profissional", durationMinutes: 30, price: 45.00, category: "Barba" },
    { id: 3, name: "Combo (Corte + Barba)", durationMinutes: 75, price: 95.00, category: "Combos" },
    { id: 4, name: "Sobrancelha", durationMinutes: 15, price: 25.00, category: "Estética" },
    { id: 5, name: "Pigmentação", durationMinutes: 45, price: 55, category: 'Barba' },
    { id: 6, name: "Corte Feminino", durationMinutes: 60, price: 150, category: 'Cabelo' },
    { id: 7, name: "Corte Máquina", durationMinutes: 30, price: 45, category: 'Cabelo' },
    { id: 8, name: "Degradê + Pigmentação", durationMinutes: 60, price: 110, category: 'Cabelo' },
    { id: 9, name: "Corte Clássico", durationMinutes: 30, price: 60, category: 'Cabelo' },
  ]);

  // Appointments
  const [appointments, setAppointments] = React.useState<any[]>([]);

  // Barbers
  const [barbers, setBarbers] = React.useState<any[]>([]);

  // Financial Records (Expenses and Manual Income)
  const [financialRecords, setFinancialRecords] = React.useState<any[]>([]);

  // Business Hours
  const [businessHours, setBusinessHours] = React.useState<any[]>([]);

  // Shop Profile Settings
  const [shopProfile, setShopProfile] = React.useState({
    name: 'Carregando...',
    email: '',
    phone: '',
    address: '',
    logo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=400&fit=crop&q=80',
    description: '',
    userName: ''
  });

  const [themeConfig, setThemeConfig] = React.useState({
    primaryColor: '#eab308',
    layout: 'modern' as 'modern' | 'classic',
    bgTheme: 'original'
  });

  // Clients
  const [clients, setClients] = React.useState<any[]>([]);

  // Apply background theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeConfig.bgTheme || 'original');
  }, [themeConfig.bgTheme]);

  // Load Settings from LocalStorage or DB
  React.useEffect(() => {
    if (userProfile?.id) {
      const savedProfile = localStorage.getItem(`shopProfile_${userProfile.id}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          // Use timeout to avoid calling setState during render phase (lint warning)
          setTimeout(() => {
            setShopProfile(prev => ({ ...prev, ...parsed }));
          }, 0);
        } catch (e) {
          console.error("Error parsing saved profile", e);
        }
      }
      
      const savedTheme = localStorage.getItem(`themeConfig_${userProfile.id}`);
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme);
          setTimeout(() => {
            setThemeConfig(prev => ({ ...prev, ...parsed }));
          }, 0);
        } catch (e) {
          console.error("Error parsing saved theme", e);
        }
      }
    } else {
      // Clear data when logged out
      // Use timeout to avoid calling setState during render phase (lint warning)
      setTimeout(() => {
        setAppointments([]);
        setDrinks([]);
        setSupplies([]);
        setServices([]);
        setBarbers([]);
        setClients([]);
        setFinancialRecords([]);
        
        // Reset to default
        setShopProfile({
          name: 'Carregando...',
          email: '',
          phone: '',
          address: '',
          logo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop&q=80',
          heroImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=400&fit=crop&q=80',
          description: '',
          userName: ''
        });
      }, 0);
    }
  }, [userProfile]);

  const handleUpdateProfile = async (newProfile: any) => {
    const updated = { ...shopProfile, ...newProfile };
    setShopProfile(updated);
    
    // Save to Database
    const supabase = getSupabase();
    if (supabase && userProfile?.establishment_id) {
      try {
        const { error } = await supabase
          .from('establishments')
          .update({
            name: updated.name,
            settings: {
              email: updated.email,
              phone: updated.phone,
              address: updated.address,
              logo: updated.logo,
              heroImage: updated.heroImage,
              description: updated.description,
              userName: updated.userName
            }
          })
          .eq('id', userProfile.establishment_id);
        
        if (error) throw error;
        showNotification('Configurações salvas no sistema!');
      } catch (err) {
        console.error('Erro ao salvar no banco:', err);
        showNotification('Erro ao sincronizar. Usando cache local.');
      }
    }

    // Use user-specific key to avoid multi-tenant leaking in same browser
    if (userProfile?.id) {
      try {
        localStorage.setItem(`shopProfile_${userProfile.id}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage quota exceeded', e);
      }
    }
  };

  const handleUpdateBarbers = async (newBarbers: any[]) => {
    setBarbers(newBarbers);
    const supabase = getSupabase();
    if (supabase && userProfile?.establishment_id) {
      try {
        // 1. Identify and delete barbers that were removed
        const currentDbIds = newBarbers.map(b => b.id).filter(id => id && id.toString().length > 20);
        // We compare with the previous state (barbers) to find what was deleted
        const barbersToDelete = barbers.filter(b => b.id && b.id.toString().length > 20 && !currentDbIds.includes(b.id));
        
        for (const barber of barbersToDelete) {
          await supabase.from('barbers').delete().eq('id', barber.id);
        }

        // 2. Update or Insert remaining barbers
        for (const barber of newBarbers) {
          if (barber.id && barber.id.toString().length > 20) {
            // Existing barber - update
            const { error: updateErr } = await supabase.from('barbers').update({
              name: barber.name,
              specialty: barber.specialty,
              color: barber.color,
              commission_type: barber.commission_type,
              commission_rate: barber.commission_rate,
              commission_fixed_value: barber.commission_fixed_value
            }).eq('id', barber.id);
            if (updateErr) {
              console.error("Error updating barber:", updateErr);
              alert("Erro ao atualizar funcionário " + barber.name + ": " + updateErr.message);
            } else {
              // Generate access if requested
              if (barber.access_email && barber.access_password && !barber.has_access) {
                const res = await createEmployeeAccount(barber.access_email, barber.access_password, barber.name, userProfile.establishment_id);
                if (res.success) {
                  alert(`Acesso gerado com sucesso para ${barber.name}!`);
                } else {
                  alert(`Erro ao criar acesso para ${barber.name}: ${res.error}`);
                }
              }
            }
          } else if (barber.id && barber.id.toString().startsWith('new-')) {
            // New barber - insert and we'll refresh later
            const { error: insertErr } = await supabase.from('barbers').insert([{
              name: barber.name,
              specialty: barber.specialty,
              color: barber.color,
              commission_type: barber.commission_type || 'percentage',
              commission_rate: barber.commission_rate || 40,
              commission_fixed_value: barber.commission_fixed_value || 15,
              establishment_id: userProfile.establishment_id
            }]);
            if (insertErr) {
              console.error("Error inserting barber:", insertErr);
              alert("Erro ao criar funcionário " + barber.name + ": " + insertErr.message);
            } else {
              // Generate access if requested for new barber
              if (barber.access_email && barber.access_password && !barber.has_access) {
                const res = await createEmployeeAccount(barber.access_email, barber.access_password, barber.name, userProfile.establishment_id);
                if (res.success) {
                  alert(`Acesso gerado com sucesso para ${barber.name}!`);
                } else {
                  alert(`Erro ao criar acesso para ${barber.name}: ${res.error}`);
                }
              }
            }
          }
        }
        
        // 3. Refresh to get real IDs and ensure consistency - MUST FILTER BY establishmentId
        const { data } = await supabase.from('barbers')
          .select('*')
          .eq('establishment_id', userProfile.establishment_id);
        if (data) {
           setBarbers(data.map((b: any) => ({
             id: b.id,
             name: b.name,
             specialty: b.specialty,
             color: b.color || 'bg-primary',
             commission_type: b.commission_type,
             commission_rate: b.commission_rate,
             commission_fixed_value: b.commission_fixed_value
           })));
        }
      } catch (err) {
        console.error('Error in handleUpdateBarbers:', err);
      }
    }
  };

  const handleUpdateBusinessHours = async (newHours: any[]) => {
    setBusinessHours(newHours);
    const supabase = getSupabase();
    if (supabase && userProfile?.establishment_id) {
       // Omit IDs if they are not existing UUIDs to prevent upsert issues
       const hoursToUpsert = newHours.map(h => {
         const { id, created_at, ...rest } = h;
         const base = { ...rest, establishment_id: userProfile.establishment_id };
         return base;
       });

       // Uses the correct SaaS multi-tenant constraint
       const { error } = await supabase.from('business_hours').upsert(hoursToUpsert, { onConflict: 'day_of_week,establishment_id' });
       
       if (error) {
         console.error('Error updating business hours:', error.message || error);
         showNotification('Erro ao salvar horários');
       } else {
         showNotification('Horários atualizados no sistema!');
         // Refresh
         const { data } = await supabase.from('business_hours')
           .select('*')
           .eq('establishment_id', userProfile.establishment_id)
           .order('day_of_week', { ascending: true });
         if (data) setBusinessHours(data);
       }
    }
  };



  // Supa  // Supabase Fetching
  const fetchData = React.useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Build base queries
    let invQuery = supabase.from('inventory').select('*');
    let srvQuery = supabase.from('services').select('*');
    let aptQuery = supabase.from('appointments').select('*').neq('status', 'cancelado');
    let barberQuery = supabase.from('barbers').select('*');
    let hoursQuery = supabase.from('business_hours').select('*').order('day_of_week', { ascending: true });
    let clientsQuery = supabase.from('clients').select('*');
    let finQuery = supabase.from('financial_records').select('*');
    let estQuery = supabase.from('establishments').select('*');
    let profilesQuery = supabase.from('profiles').select('full_name, role').eq('role', 'employee');

    // Filter by establishment if profile exists
    if (userProfile?.establishment_id) {
      invQuery = invQuery.eq('establishment_id', userProfile.establishment_id);
      srvQuery = srvQuery.eq('establishment_id', userProfile.establishment_id);
      aptQuery = aptQuery.eq('establishment_id', userProfile.establishment_id);
      barberQuery = barberQuery.eq('establishment_id', userProfile.establishment_id);
      hoursQuery = hoursQuery.eq('establishment_id', userProfile.establishment_id);
      clientsQuery = clientsQuery.eq('establishment_id', userProfile.establishment_id);
      finQuery = finQuery.eq('establishment_id', userProfile.establishment_id);
      estQuery = estQuery.eq('id', userProfile.establishment_id);
      profilesQuery = profilesQuery.eq('establishment_id', userProfile.establishment_id);
    } else {
      // If no establishment_id, we shouldn't fetch any tenant-specific data
      setAppointments([]);
      setDrinks([]);
      setSupplies([]);
      setServices([]);
      setBarbers([]);
      setClients([]);
      setFinancialRecords([]);
      return;
    }

    const [invResponse, srvResponse, aptResponse, barberResponse, hoursResponse, clientsRes, finRes, estRes, profilesRes] = await Promise.all([
      invQuery,
      srvQuery,
      aptQuery,
      barberQuery,
      hoursQuery,
      clientsQuery,
      finQuery,
      estQuery,
      profilesQuery
    ]);

    if (estRes.error) {
      console.error('Error fetching establishment:', estRes.error);
    } else if (estRes.data && estRes.data.length > 0) {
      const est = estRes.data[0];
      const settings = est.settings || {};
      setShopProfile(prev => ({
        ...prev,
        id: est.id,
        subscription_status: est.subscription_status,
        created_at: est.created_at,
        name: est.name || prev.name,
        ...settings
      }));

      if (est.trial_ends_at) {
        const trialEnds = new Date(est.trial_ends_at).getTime();
        const now = new Date().getTime();
        if (now > trialEnds && est.subscription_status !== 'active') {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      }
    }

    if (finRes.data) {
      setFinancialRecords(finRes.data);
    }

    if (clientsRes.data) {
      // Aggregate unique clients from both tables
      const clientMap: Record<string, any> = {};
      clientsRes.data.forEach((c: any) => {
        clientMap[c.phone || c.id] = { id: c.id, name: c.name, phone: c.phone };
      });
      
      if (aptResponse.data) {
        aptResponse.data.forEach((a: any) => {
          if (a.client_phone && !clientMap[a.client_phone]) {
            clientMap[a.client_phone] = { name: a.client_name, phone: a.client_phone };
          }
        });
      }
      setClients(Object.values(clientMap));
    }

    if (invResponse.error) {
      console.error('Error fetching inventory:', invResponse.error);
      if (invResponse.error.message.includes('fetch')) {
         setNotification('Erro ao conectar com o banco. Usando dados offline.');
      }
    } else if (invResponse.data) {
      const drinksData = invResponse.data.filter((item: any) => item.type === 'drink');
      const suppliesData = invResponse.data.filter((item: any) => item.type === 'supply');
      
      setDrinks(drinksData);
      setSupplies(suppliesData);
    }

    if (srvResponse.error) {
      console.error('Error fetching services:', srvResponse.error);
    } else if (srvResponse.data) {
      const mappedServices = srvResponse.data.map((s: any) => ({
        ...s,
        duration: s.duration || (s.duration_minutes ? `${s.duration_minutes} min` : '30 min'),
        durationMinutes: s.duration_minutes || parseInt(s.duration?.replace(/\D/g, '') || '30')
      }));
      setServices(mappedServices);
    }

    if (barberResponse.error) {
      console.error('Error fetching barbers:', barberResponse.error);
    } else if (barberResponse.data) {
      const activeEmployeeNames = (profilesRes?.data || []).map((p: any) => p.full_name);

      // Map DB barbers to UI format
      const mappedBarbers = barberResponse.data.map((b: any) => ({
        id: b.id,
        name: b.name,
        specialty: b.specialty,
        color: b.color || 'bg-primary',
        commission_type: b.commission_type,
        commission_rate: b.commission_rate,
        commission_fixed_value: b.commission_fixed_value,
        has_access: activeEmployeeNames.includes(b.name)
      }));
      setBarbers(mappedBarbers);
    }

    if (hoursResponse.error) {
      console.error('Error fetching business hours:', hoursResponse.error.message || hoursResponse.error);
    } else if (hoursResponse.data && hoursResponse.data.length > 0) {
      setBusinessHours(hoursResponse.data);
    } else if (hoursResponse.data && hoursResponse.data.length === 0 && userProfile?.establishment_id) {
      // Seed initial data if empty
      const defaultHours = [
        { day_of_week: 0, open_time: null, close_time: null, is_closed: true, establishment_id: userProfile.establishment_id },
        { day_of_week: 1, open_time: '08:00', close_time: '19:00', is_closed: false, establishment_id: userProfile.establishment_id },
        { day_of_week: 2, open_time: '08:00', close_time: '19:00', is_closed: false, establishment_id: userProfile.establishment_id },
        { day_of_week: 3, open_time: '08:00', close_time: '19:00', is_closed: false, establishment_id: userProfile.establishment_id },
        { day_of_week: 4, open_time: '08:00', close_time: '19:00', is_closed: false, establishment_id: userProfile.establishment_id },
        { day_of_week: 5, open_time: '08:00', close_time: '19:00', is_closed: false, establishment_id: userProfile.establishment_id },
        { day_of_week: 6, open_time: '08:00', close_time: '14:00', is_closed: false, establishment_id: userProfile.establishment_id },
      ];
      await supabase.from('business_hours').insert(defaultHours);
      const { data } = await supabase.from('business_hours')
        .select('*')
        .eq('establishment_id', userProfile.establishment_id)
        .order('day_of_week', { ascending: true });
      if (data) setBusinessHours(data.map((h: any) => ({
        ...h,
        day: h.day_of_week
      })));
    }

    if (aptResponse?.error) {
      console.error('Error fetching appointments:', aptResponse.error);
    } else if (aptResponse?.data) {
      // Map Supabase layout to UI component format 
      const mappedData = aptResponse.data.map((dbApt: any) => {
        const fullDate = dbApt.appointment_date;
        let dayValue = new Date().getDate();
        if (fullDate) {
           const parts = fullDate.split('-');
           if (parts.length === 3) dayValue = parseInt(parts[2], 10);
        }
        
        return {
          id: dbApt.id,
          client: dbApt.client_name,
          client_phone: dbApt.client_phone,
          service: dbApt.service_name,
          service_id: dbApt.service_id,
          barber: dbApt.barber_name,
          barberId: dbApt.barber_id,
          time: dbApt.start_time?.substring(0, 5),
          durationMinutes: dbApt.duration_minutes || 45,
          day: dayValue,
          fullDate: fullDate,
          date: fullDate,
          colorClass: dbApt.color_class || "bg-primary/10 border-primary text-primary",
          status: dbApt.status || "confirmado",
          price: Number(dbApt.price) || 0,
          value: Number(dbApt.price) || 0
        };
      });
      setAppointments(mappedData);
    }
  }, [userProfile]);

  React.useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();

    const supabase = getSupabase();
    if (!supabase) return;

    // Real-time Listeners
    const aptSubscription = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchData();
      })
      .subscribe();

    const finSubscription = supabase
      .channel('financial-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_records' }, () => {
        fetchData(); 
      })
      .subscribe();

    return () => {
      aptSubscription.unsubscribe();
      finSubscription.unsubscribe();
    };
  }, [fetchData, userProfile]);

  // Notifications State
  const [baseNotifications, setBaseNotifications] = React.useState<any[]>([]);

  // Combined Notifications (Base + Dynamic Stock)
  const allNotifications = React.useMemo(() => {
    const lowStockNotifications = [...drinks, ...supplies]
      .filter(item => item.stock !== undefined && item.stock < 10)
      .map(item => ({
        id: `stock-${item.id}`,
        title: 'Alerta de Estoque',
        message: `${item.name} está com apenas ${item.stock} unidades. Reabasteça logo!`,
        time: 'Agora',
        unread: true,
        isStock: true
      }));

    return [...lowStockNotifications, ...baseNotifications];
  }, [drinks, supplies, baseNotifications]);

  const handleMarkAllRead = () => {
    setBaseNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    // Note: Stock notifications are dynamic based on state, 
    // so they only "disappear" or change status if stock changes 
    // or if we add more complex read tracking. 
    // For this demo, we'll just mark the base ones.
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    // Explicitly clear all data states immediately
    setAppointments([]);
    setDrinks([]);
    setSupplies([]);
    setServices([]);
    setBarbers([]);
    setClients([]);
    setFinancialRecords([]);
    setBusinessHours([]);
    setUserProfile(null);
    setIsAuthenticated(false);
  };

  React.useEffect(() => {
    // Dynamically update the primary color in the CSS variable
    document.documentElement.style.setProperty('--color-primary', themeConfig.primaryColor);
    
    // Create a lighter and darker version for secondary accents and depth
    if (themeConfig.primaryColor.startsWith('#')) {
      const r = parseInt(themeConfig.primaryColor.slice(1, 3), 16);
      const g = parseInt(themeConfig.primaryColor.slice(3, 5), 16);
      const b = parseInt(themeConfig.primaryColor.slice(5, 7), 16);
      
      const light = `rgba(${r}, ${g}, ${b}, 0.8)`;
      const dark = `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 1)`;
      const surface = `rgba(${r}, ${g}, ${b}, 0.03)`;
      
      document.documentElement.style.setProperty('--color-primary-light', light);
      document.documentElement.style.setProperty('--color-primary-dark', dark);
      document.documentElement.style.setProperty('--color-surface-accent', surface);
    }
  }, [themeConfig.primaryColor]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNewAppointment = async (data: any) => {
    // Rely completely on what the Modal evaluated since it controls the true Form data. 
    // Fallbacks just in case something breaks during passing
    const serviceName = data.serviceName || "Atendimento Vário";
    const duration = data.durationMinutes || 45;
    
      // UI State Payload (For the dashboard to work reactively)
      const newAppointmentUI = {
        id: Date.now(), // Fallback UI ID
        client: data.name,
        client_phone: data.phone,
        barber: data.barber || "Rodrigo (Sênior)",
        service: serviceName,
        time: data.time,
        durationMinutes: duration,
        day: parseInt(data.date.split('-')[2], 10) || new Date().getDate(),
        fullDate: data.date,
        colorClass: data.colorClass || "bg-primary/10 border-primary text-primary",
        status: "confirmado",
        price: `R$ ${data.totalPrice},00`,
        source: 'app'
      };

    setAppointments(prev => [...prev, newAppointmentUI]);
    setBaseNotifications(prev => [{
      id: `app-${Date.now()}`,
      title: 'Novo Agendamento',
      message: `${data.name} marcou ${serviceName} para às ${data.time}.`,
      time: 'Agora',
      unread: true
    }, ...prev]);
    showNotification("Atendimento criado com sucesso na agenda!");

    // Database Payload (Formatted for your exact Supabase schema)
    const supabase = getSupabase();
    if (supabase) {
      const establishmentId = data.establishmentId || userProfile?.establishment_id;
      
      let clientId = data.clientId;
      if (!clientId && data.name && data.phone && establishmentId) {
        // Create new client to avoid Foreign Key Constraint
        const { data: newClient, error: clientErr } = await supabase.from('clients').insert([{
          name: data.name,
          phone: data.phone,
          establishment_id: establishmentId
        }]).select().single();
        
        if (!clientErr && newClient) {
          clientId = newClient.id;
          // Atualiza lista de clientes na memória para feedback instantâneo
          setClients(prev => [...prev, { id: clientId, name: data.name, phone: data.phone }]);
        } else {
          console.error("Erro ao criar cliente:", clientErr);
        }
      }

      // Try to calculate end_time for the database payload
      const [hours, minutes] = newAppointmentUI.time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + newAppointmentUI.durationMinutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

    const dbPayload: any = {
        client_name: newAppointmentUI.client,
        client_phone: data.phone,
        barber_name: newAppointmentUI.barber,
        service_name: newAppointmentUI.service,
        establishment_id: establishmentId,
        appointment_date: newAppointmentUI.fullDate,
        start_time: `${newAppointmentUI.time}:00`,
        end_time: endTimeStr,
        duration_minutes: newAppointmentUI.durationMinutes,
        price: typeof data.totalPrice === 'number' ? data.totalPrice : parseFloat(data.totalPrice.toString().replace('R$ ', '').replace(',', '.')),
        color_class: newAppointmentUI.colorClass,
        status: newAppointmentUI.status,
        source: 'app'
      };

      const { data: insertedData, error } = await supabase.from('appointments').insert([dbPayload]).select();
      
      if (error) {
        console.error("Erro ao salvar agendamento no Supabase:", error.message, error.details || error.hint);
        showNotification("Aviso: O BD recusou o salvamento devido às Restrições de Chave Estrangeira. Usando estado local.");
      } else if (insertedData && insertedData.length > 0) {
        // Optionally update the UI with the real UUID generated by DB
        setAppointments(prev => prev.map(a => a.id === newAppointmentUI.id ? { ...a, id: insertedData[0].id } : a));
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
            >
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  Visão Geral <Zap size={20} className="text-amber-500 fill-amber-500" />
                </h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Bem-vindo de volta! Aqui está o desempenho da {shopProfile.name} hoje.</p>
              </div>
              
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-outline shadow-xs self-start md:self-auto">
                {['Hoje', 'Semana', 'Mês'].map((label) => (
                  <button 
                    key={label}
                    onClick={() => {
                      setTimeRange(label);
                      showNotification(`Filtro alterado para: ${label}`);
                    }}
                    className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${
                      timeRange === label ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>

            <KPIStats timeRange={timeRange} appointments={userProfile?.role === 'employee' && userProfile?.full_name ? appointments.filter(a => a.barber === userProfile.full_name) : appointments} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AppointmentsTable 
                  appointments={appointments.filter(a => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isToday = a.fullDate === todayStr || a.day === new Date().getDate();
                    if (userProfile?.role === 'employee' && userProfile?.full_name) {
                       return isToday && a.barber === userProfile.full_name;
                    }
                    return isToday;
                  })} 
                  onSeeAll={() => setActiveTab('calendar')} 
                  onDeleteAppointment={async (id) => {
                    const supabase = getSupabase();
                    if (supabase) {
                      const { error } = await supabase.from('appointments').delete().eq('id', id);
                      if (!error) {
                        setAppointments(prev => prev.filter(a => a.id !== id));
                        showNotification('Agendamento excluído com sucesso!');
                      } else {
                        console.error('Error deleting:', error);
                      }
                    }
                  }}
                  onUpdateStatus={async (id, status) => {
                    const supabase = getSupabase();
                    if (supabase) {
                      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
                      if (!error) {
                        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
                        showNotification(`Status atualizado para ${status}!`);
                      } else {
                        console.error('Error updating status:', error);
                      }
                    }
                  }}
                />
              </div>
              <div className="lg:col-span-1">
                <RecentClients appointments={userProfile?.role === 'employee' && userProfile?.full_name ? appointments.filter(a => a.barber === userProfile.full_name) : appointments} onNewClient={() => setIsNewAppointmentOpen(true)} />
              </div>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <CalendarView 
            appointments={appointments} 
            barbersList={barbers}
            userProfile={userProfile}
            onNewAppointment={() => setIsNewAppointmentOpen(true)} 
          />
        );
      case 'clients':
        return <ClientsView onNewClient={() => setIsNewAppointmentOpen(true)} establishmentId={userProfile?.establishment_id} />;
      case 'financial':
        if (userProfile?.role === 'employee') {
          setActiveTab('dashboard');
          return null;
        }
        return (
          <FinanceView 
            appointments={appointments} 
            financialRecords={financialRecords}
            barbers={barbers} 
            services={services}
            inventory={{ drinks, supplies }}
            onUpdateBarbers={handleUpdateBarbers}
            establishmentId={userProfile?.establishment_id}
            activeTab={financeTab}
            onTabChange={setFinanceTab}
          />
        );
      case 'history':
        return <HistoryView 
          onRefresh={fetchData} 
          services={services} 
          inventory={{ drinks, supplies }}
          establishmentId={userProfile?.establishment_id}
          userProfile={userProfile}
        />;
      case 'services':
        if (userProfile?.role === 'employee') {
          setActiveTab('dashboard');
          return null;
        }
        return <ServicesView 
          services={services}
          drinks={drinks}
          supplies={supplies}
          onUpdateServices={setServices}
          onUpdateDrinks={setDrinks}
          onUpdateSupplies={setSupplies}
          appointments={appointments}
          establishmentId={userProfile?.establishment_id}
          activeTab={servicesTab}
          onTabChange={setServicesTab}
        />;
      case 'notifications':
        return <NotificationsView 
          notifications={allNotifications}
          onMarkRead={(id) => {
            setBaseNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
          }}
          onDelete={(id) => {
            setBaseNotifications(prev => prev.filter(n => n.id !== id));
          }}
          onClearAll={() => {
            setBaseNotifications([]);
          }}
        />;
      case 'settings':
        if (userProfile?.role === 'employee') {
          setActiveTab('dashboard');
          return null;
        }
        return <SettingsView 
          profile={shopProfile} 
          theme={themeConfig}
          barbers={barbers}
          externalHours={businessHours}
          onUpdateBusinessHours={handleUpdateBusinessHours}
          onUpdateBarbers={handleUpdateBarbers}
          onProfileUpdate={handleUpdateProfile} 
          activeSection={settingsSection}
          onSectionChange={setSettingsSection}
          onThemeUpdate={(newTheme) => {
            setThemeConfig(prev => {
              const updated = { ...prev, ...newTheme };
              if (userProfile?.id) {
                try {
                  localStorage.setItem(`themeConfig_${userProfile.id}`, JSON.stringify(updated));
                } catch (e) {
                  console.warn('LocalStorage quota exceeded for themeConfig');
                }
              }
              return updated;
            });
          }}
        />;
      default:
        return <div>Em breve...</div>;
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <span className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Verificando sessão...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Zap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Tudo certo! Como você está testando localmente, o webhook pode não atualizar o banco na hora. Mas o fluxo da Stripe funcionou perfeitamente.
          </p>
          <button 
            onClick={() => {
              // Limpa a URL e recarrega
              window.history.replaceState(null, '', window.location.pathname);
              setIsSuccess(false);
            }} 
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all"
          >
            Entendi
          </button>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <LockedScreen shopName={shopProfile.name} establishmentId={userProfile?.establishment_id || ''} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-0 left-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10"
          >
            <Zap size={14} className="text-amber-400 fill-amber-400" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000" 
          style={{ backgroundColor: `${themeConfig.primaryColor}15` }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full blur-[100px] transition-colors duration-1000" 
          style={{ backgroundColor: `${themeConfig.primaryColor}10` }}
        />
      </div>

      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        shopName={shopProfile.name}
        shopLogo={shopProfile.logo}
        userName={shopProfile.userName || userProfile?.full_name || 'Dono'}
        userRole={userProfile?.role || 'owner'}
        layout={themeConfig.layout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <TopBar 
          shopName={shopProfile.name}
          shopLogo={shopProfile.logo}
          layout={themeConfig.layout}
          notifications={allNotifications}
          onMarkAllRead={handleMarkAllRead}
          onLogout={handleLogout}
          onHistoryClick={() => setActiveTab('notifications')}
          userName={shopProfile.userName || userProfile?.full_name || 'Dono'}
          userEmail={sessionEmail}
          onSearch={(q) => {
            setGlobalSearch(q);
            const qLower = q.toLowerCase();
            
            // 1. Configurações
            if (qLower.includes('config') || qLower.includes('perfil') || qLower.includes('equipe') || qLower.includes('funcionário') || qLower.includes('funcionario') || qLower.includes('horário') || qLower.includes('horario') || qLower.includes('faturam') || qLower.includes('personaliz')) {
              setActiveTab('settings');
              if (qLower.includes('perfil') || qLower.includes('negócio') || qLower.includes('negocio')) {
                setSettingsSection('profile');
              } else if (qLower.includes('equipe') || qLower.includes('funcionário') || qLower.includes('funcionario')) {
                setSettingsSection('barbers');
              } else if (qLower.includes('horário') || qLower.includes('horario') || qLower.includes('funcionamento')) {
                setSettingsSection('hours');
              } else if (qLower.includes('faturam') || qLower.includes('assinatura') || qLower.includes('pagamento')) {
                setSettingsSection('billing');
              } else if (qLower.includes('personaliz') || qLower.includes('tema') || qLower.includes('layout')) {
                setSettingsSection('theme');
              }
            } 
            // 2. Controle Financeiro
            else if (qLower.includes('finan') || qLower.includes('caixa') || qLower.includes('fluxo') || qLower.includes('visão') || qLower.includes('visao') || qLower.includes('comiss') || qLower.includes('estoque') || qLower.includes('insumo')) {
              setActiveTab('financial');
              if (qLower.includes('fluxo')) {
                setFinanceTab('flow');
              } else if (qLower.includes('comiss')) {
                setFinanceTab('commissions');
              } else if (qLower.includes('estoque') || qLower.includes('insumo')) {
                setFinanceTab('inventory');
              } else if (qLower.includes('visão') || qLower.includes('visao') || qLower.includes('geral')) {
                setFinanceTab('overview');
              }
            } 
            // 3. Serviços
            else if (qLower.includes('serviç') || qLower.includes('servic') || qLower.includes('bebida') || qLower.includes('produto')) {
              setActiveTab('services');
              if (qLower.includes('bebida')) {
                setServicesTab('drinks');
              } else if (qLower.includes('produto') || qLower.includes('insumo')) {
                setServicesTab('supplies');
              } else {
                setServicesTab('services');
              }
            } 
            // 4. Outros
            else if (qLower.includes('cliente')) {
              setActiveTab('clients');
            } else if (qLower.includes('históric') || qLower.includes('historic')) {
              setActiveTab('history');
            } else if (qLower.includes('agend') || qLower.includes('calend')) {
              setActiveTab('calendar');
            } else if (qLower.includes('dash') || qLower.includes('inicio') || qLower.includes('início')) {
              setActiveTab('dashboard');
            }
          }} 
          onNewAppointment={() => setIsNewAppointmentOpen(true)}
          onNotificationClick={() => showNotification("Você tem 3 novas notificações de agendamentos")}
          onHelpClick={() => showNotification("Central de Ajuda indisponível nesta demonstração")}
          onSettingsClick={() => setActiveTab('settings')}
          onMenuToggle={() => setIsSidebarOpen(true)}
        />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <div key={activeTab}>
              <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                {renderContent()}
              </div>
              
              <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                <footer className="mt-12 py-6 border-t border-outline flex flex-col md:flex-row justify-center items-center gap-4 text-[11px] text-muted-theme font-bold uppercase tracking-widest text-center">
                  <span>@2026 {shopProfile.name}</span>
                </footer>
              </div>
            </div>
          </AnimatePresence>
        </div>
      </main>

      <NewAppointmentModal 
        isOpen={isNewAppointmentOpen} 
        onClose={() => setIsNewAppointmentOpen(false)}
        onSuccess={handleNewAppointment}
        barbersList={barbers}
        servicesList={services}
        inventoryList={[...drinks, ...supplies]}
        businessHours={businessHours}
        clientsList={clients}
        appointments={appointments}
        establishmentId={userProfile?.establishment_id}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
