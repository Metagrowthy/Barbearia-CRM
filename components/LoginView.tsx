'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Lock, Mail, ArrowRight } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface LoginViewProps {
  onLogin: () => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const supabase = getSupabase();
    if (!supabase) {
      setError('Banco de dados não conectado. Verifique as configurações.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else {
          setError(error.message);
        }
      } else if (data.session) {
        onLogin();
      }
    } catch (err: any) {
      setError('Ocorreu um erro ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 bg-primary/10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full blur-[100px] transition-colors duration-1000 bg-primary/5" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-outline relative z-10"
      >
        <div className="p-8 royal-gradient text-white flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/20">
            <Scissors size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Royal Precision</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-light">CRM de Barbearia</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                <Mail size={12} /> Email
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900"
                placeholder="admin@barber.com"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2">
                <Lock size={12} /> Senha
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-outline rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-hidden text-gray-900"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 text-center">{error}</p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 royal-gradient text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="animate-pulse">Acessando...</span>
              ) : (
                <>Entrar no Sistema <ArrowRight size={16} /></>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Ambiente Restrito
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
