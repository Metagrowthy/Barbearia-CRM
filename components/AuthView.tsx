'use client';

import React from 'react';
import { getSupabase } from '@/lib/supabase';
import { Mail, Lock, User, Scissors, ArrowRight, Loader2, Store, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkCnpjExists } from '@/app/actions';

export default function AuthView() {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [shopName, setShopName] = React.useState('');
  const [cnpj, setCnpj] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4}).*/, '$1.$2.$3/$4');
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,3}).*/, '$1.$2');
    }
    setCnpj(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError("As chaves do Supabase não estão configuradas no arquivo .env.local.");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) {
          setError('O CNPJ deve ter 14 dígitos válidos.');
          setIsLoading(false);
          return;
        }

        const { exists } = await checkCnpjExists(cnpj);
        if (exists) {
          setError('🚨 Este CNPJ já foi utilizado e possui um período de teste ou conta ativa em nosso sistema.');
          setIsLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              shop_name: shopName,
              cnpj: cnpj
            },
          },
        });
        
        if (signUpError) throw signUpError;
        
        alert('Conta enviada! Se o Supabase não enviar e-mail de confirmação, tente fazer login diretamente.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 border border-gray-100 p-8 md:p-12"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leftLeg" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#84cc16" /> {/* Lime green */}
                  <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
                </linearGradient>
                <linearGradient id="rightLeg" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
                  <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
                </linearGradient>
              </defs>
              {/* Left Ribbon (Mathematically Perfect Angle) */}
              <path 
                d="M 14 80 L 34 30 L 50 70" 
                fill="none" 
                stroke="url(#leftLeg)" 
                strokeWidth="18" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Right Ribbon (Mathematically Perfect Angle & Overlapping) */}
              <path 
                d="M 50 70 L 66 30 L 86 80" 
                fill="none" 
                stroke="url(#rightLeg)" 
                strokeWidth="18" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Meta Growthy CRM</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 max-w-[280px] leading-relaxed">
            {isLogin ? 'O controle do seu negócio em um só lugar' : 'Crie sua conta'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Seu Nome</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all"
                      placeholder="Nome do Dono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nome do Estabelecimento</label>
                  <div className="relative group">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all"
                      placeholder="Ex: Minha Empresa Premium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">CNPJ</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      required
                      value={cnpj}
                      onChange={handleCnpjChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-sm font-bold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Criar Conta'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
