'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Lock, CreditCard, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface LockedScreenProps {
  shopName: string;
  establishmentId: string;
}

export default function LockedScreen({ shopName, establishmentId }: LockedScreenProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pagamento/finalizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          establishmentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar o pagamento.');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Erro de conexão. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side - Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Lock size={24} />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Seu período de teste expirou!
          </h1>
          <p className="text-gray-500 mb-8">
            Esperamos que você tenha aproveitado os 10 dias gratuitos na <span className="font-semibold text-gray-700">{shopName}</span>. Para continuar usando o sistema, escolha um plano.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              <span className="text-gray-700">Agendamentos ilimitados</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              <span className="text-gray-700">Gestão financeira completa</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              <span className="text-gray-700">Controle de estoque e comissões</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              <span className="text-gray-700">Suporte prioritário</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 self-start transition-colors"
          >
            Sair da conta
          </button>
        </div>

        {/* Right Side - Payment */}
        <div className="w-full md:w-1/2 bg-gray-50 p-8 md:p-12 flex flex-col justify-center items-center text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6">
            <Sparkles className="text-amber-500" size={24} />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">Plano - CRM Basic</h2>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-extrabold text-gray-900">R$ 79,99</span>
            <span className="text-gray-500 font-medium">/mês</span>
          </div>

          {error && (
            <div className="w-full p-3 mb-6 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Lock size={20} />
                </motion.div>
                Processando...
              </span>
            ) : (
              <>
                <CreditCard size={20} />
                Assinar Agora
                <ArrowRight size={20} />
              </>
            )}
          </button>
          
          <p className="mt-6 text-xs text-gray-400 flex flex-col items-center gap-1">
            <span>Pagamento seguro via Stripe.</span>
            <span>Cancele quando quiser.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
