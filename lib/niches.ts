import { 
  Scissors, Paintbrush, Dumbbell, Sparkles, HeartPulse, Flower2, Layers
} from 'lucide-react';

export interface NicheConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  primaryColor: string;
  employeeLabelSingular: string;
  employeeLabelPlural: string;
  teamSectionTitle: string;
  beverageTerm: string;
  supplyTerm: string;
  defaultServices: Array<{
    name: string;
    duration: string;
    price: number;
    category: string;
    description: string;
    image_url: string;
  }>;
}

export const NICHES: NicheConfig[] = [
  {
    id: 'barbershop',
    name: 'Barbearia & Cabelo',
    icon: Scissors,
    primaryColor: '#10b981', // Emerald
    employeeLabelSingular: 'Barbeiro',
    employeeLabelPlural: 'Barbeiros',
    teamSectionTitle: 'Equipe & Barbeiros',
    beverageTerm: 'Bebida',
    supplyTerm: 'Produto/Insumo',
    defaultServices: [
      { 
        name: 'Corte Degradê Premium', 
        duration: '45 min', 
        price: 60.00, 
        category: 'Cabelo',
        description: 'Corte degradê moderno com acabamento detalhado na navalha e finalização com pomada modeladora.',
        image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Barba Profissional', 
        duration: '30 min', 
        price: 45.00, 
        category: 'Barba',
        description: 'Barba feita com toalha quente, espuma premium, óleo hidratante e alinhamento perfeito na navalha.',
        image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Combo (Corte + Barba)', 
        duration: '75 min', 
        price: 95.00, 
        category: 'Combos',
        description: 'O serviço completo da casa. Inclui lavagem capilar, corte degradê e barba completa com toalha quente.',
        image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Sobrancelha na Navalha', 
        duration: '15 min', 
        price: 25.00, 
        category: 'Estética',
        description: 'Design e alinhamento de sobrancelha masculino feito com técnica clássica na navalha.',
        image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    id: 'tattoo',
    name: 'Estúdio de Tatuagem & Piercing',
    icon: Paintbrush,
    primaryColor: '#dc2626', // Crimson Red
    employeeLabelSingular: 'Artista / Tatuador',
    employeeLabelPlural: 'Tatuadores / Piercers',
    teamSectionTitle: 'Artistas & Tatuadores',
    beverageTerm: 'Bebida',
    supplyTerm: 'Suprimento / Joia',
    defaultServices: [
      { 
        name: 'Tatuagem Autoral (Flash)', 
        duration: '60 min', 
        price: 300.00, 
        category: 'Tatuagem',
        description: 'Escolha um dos designs exclusivos prontos em nossa folha de flash. Tamanho até 8cm.',
        image_url: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Aplicação de Piercing Orelha', 
        duration: '30 min', 
        price: 120.00, 
        category: 'Piercing',
        description: 'Perfuração asséptica com agulha americana (cateter não) e joia básica inclusa em Titânio Grau Implante.',
        image_url: 'https://images.unsplash.com/photo-1535262412227-85541e910204?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Tatuagem Customizada (1h)', 
        duration: '60 min', 
        price: 250.00, 
        category: 'Tatuagem',
        description: 'Sessão por hora para desenvolvimento e aplicação de projeto personalizado de tatuagem.',
        image_url: 'https://images.unsplash.com/photo-1560707303-4e980c876ad2?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Sessão Fechamento de Braço (4h)', 
        duration: '240 min', 
        price: 900.00, 
        category: 'Sessões',
        description: 'Sessão de meio período (4 horas) focada em grandes projetos ou fechamento de membros.',
        image_url: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=500&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    id: 'personal_trainer',
    name: 'Personal Trainer & Assessoria',
    icon: Dumbbell,
    primaryColor: '#84cc16', // Neon Lime
    employeeLabelSingular: 'Treinador / Coach',
    employeeLabelPlural: 'Treinadores / Coaches',
    teamSectionTitle: 'Nossa Equipe de Coaches',
    beverageTerm: 'Bebida / Shake',
    supplyTerm: 'Suplemento / Equipamento',
    defaultServices: [
      { 
        name: 'Avaliação Física Completa', 
        duration: '45 min', 
        price: 80.00, 
        category: 'Avaliação',
        description: 'Análise de bioimpedância, dobras cutâneas, perímetros corporais e anamnese para traçar objetivos.',
        image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Sessão Personal Presencial', 
        duration: '60 min', 
        price: 120.00, 
        category: 'Treino Individual',
        description: 'Acompanhamento exclusivo de 1 hora com foco em execução perfeita de exercícios, biomecânica e motivação.',
        image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Assessoria de Treinos Mensal', 
        duration: '30 min', 
        price: 180.00, 
        category: 'Consultoria',
        description: 'Montagem de rotina mensal de treinos pelo aplicativo, suporte online diário e planejamento de metas.',
        image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Treino em Dupla (Sessão)', 
        duration: '60 min', 
        price: 160.00, 
        category: 'Treino em Grupo',
        description: 'Sessão presencial para duas pessoas com objetivos semelhantes. Treine com motivação e divida o valor!',
        image_url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    id: 'pilates_yoga',
    name: 'Studio de Pilates & Yoga',
    icon: Flower2,
    primaryColor: '#0f766e', // Sage / Teal
    employeeLabelSingular: 'Instrutor / Fisioterapeuta',
    employeeLabelPlural: 'Instrutores / Fisioterapeutas',
    teamSectionTitle: 'Corpo Docente & Instrutores',
    beverageTerm: 'Bebida / Chá',
    supplyTerm: 'Acessório / Produto',
    defaultServices: [
      { 
        name: 'Pilates Clínico (Aparelhos)', 
        duration: '50 min', 
        price: 90.00, 
        category: 'Pilates',
        description: 'Exercícios personalizados no Cadillac, Reformer, Chair e Barrel para fortalecimento profundo do core e reabilitação.',
        image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Aula Experimental de Hatha Yoga', 
        duration: '60 min', 
        price: 50.00, 
        category: 'Yoga',
        description: 'Introdução aos asanas (posturas), pranayamas (respiração) e técnicas de relaxamento profundo para equilíbrio corpo-mente.',
        image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Massagem Relaxante / Miofascial', 
        duration: '60 min', 
        price: 130.00, 
        category: 'Terapias',
        description: 'Terapia manual focada na liberação de tensões musculares, melhoria da flexibilidade e alívio do estresse acumulado.',
        image_url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Sessão Particular de Meditação', 
        duration: '30 min', 
        price: 60.00, 
        category: 'Mental',
        description: 'Técnicas personalizadas de mindfulness e foco na respiração para acalmar a mente e reduzir a ansiedade diária.',
        image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    id: 'lash_beauty',
    name: 'Lash Designer & Micropigmentação',
    icon: Sparkles,
    primaryColor: '#db2777', // Pink
    employeeLabelSingular: 'Designer / Lash Artist',
    employeeLabelPlural: 'Designers / Lash Artists',
    teamSectionTitle: 'Nossos Designers & Especialistas',
    beverageTerm: 'Bebida / Champanhe',
    supplyTerm: 'Cuidado Homecare',
    defaultServices: [
      { 
        name: 'Extensão de Cílios Fio a Fio', 
        duration: '120 min', 
        price: 160.00, 
        category: 'Cílios',
        description: 'Técnica clássica de aplicação de um fio sintético sobre cada cílio natural para um olhar alongado e definido de forma sutil.',
        image_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Brow Lamination & Design', 
        duration: '60 min', 
        price: 110.00, 
        category: 'Sobrancelha',
        description: 'Alinhamento químico dos fios da sobrancelha para maior volume, preenchimento de falhas e design simétrico premium.',
        image_url: 'https://images.unsplash.com/photo-1626015713026-d837d1724c9f?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Lash Lifting Completo', 
        duration: '60 min', 
        price: 130.00, 
        category: 'Cílios',
        description: 'Curvatura e nutrição profunda dos seus cílios naturais, dando efeito de rímel e durabilidade de até 6 semanas.',
        image_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Micropigmentação Labial (Sessão)', 
        duration: '150 min', 
        price: 350.00, 
        category: 'Boca / Labial',
        description: 'Técnica de revitalização e pigmentação labial efeito gloss ou batom suave, trazendo cor, simetria e beleza imediata.',
        image_url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=500&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    id: 'nails',
    name: 'Nails Detail / Nail Designer',
    icon: Sparkles,
    primaryColor: '#8b5cf6', // Violet / Lavender
    employeeLabelSingular: 'Nail Designer / Manicure',
    employeeLabelPlural: 'Nail Designers / Manicures',
    teamSectionTitle: 'Equipe de Nails & Estética',
    beverageTerm: 'Bebida / Café',
    supplyTerm: 'Esmalte / Hidratante',
    defaultServices: [
      { 
        name: 'Manicure Express & Esmaltação', 
        duration: '45 min', 
        price: 45.00, 
        category: 'Mão',
        description: 'Cutilagem perfeita, lixamento, hidratação de cutículas e esmaltação nacional de alta cobertura.',
        image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Alongamento em Gel Premium', 
        duration: '120 min', 
        price: 180.00, 
        category: 'Alongamento',
        description: 'Construção de unhas esculpidas em fibra de vidro ou gel com formato natural e estrutura reforçada de alta durabilidade.',
        image_url: 'https://images.unsplash.com/photo-1632345031435-8797b2d58045?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Blindagem de Unhas Naturais', 
        duration: '60 min', 
        price: 90.00, 
        category: 'Tratamentos',
        description: 'Camada protetora em acrílico ou gel fino que previne quebras e escamações das suas unhas naturais, promovendo crescimento saudável.',
        image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'SPA dos Pés Completo', 
        duration: '60 min', 
        price: 80.00, 
        category: 'Pé / SPA',
        description: 'Escalda pés aromático, esfoliação profunda, remoção de calosidades leves, massagem relaxante e hidratação.',
        image_url: 'https://images.unsplash.com/photo-1519735797-402b0532258b?w=500&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    id: 'vet_pet',
    name: 'Clínica Veterinária & Petshop',
    icon: HeartPulse,
    primaryColor: '#06b6d4', // Teal / Cyan
    employeeLabelSingular: 'Profissional / Veterinário',
    employeeLabelPlural: 'Veterinários & Tosadores',
    teamSectionTitle: 'Equipe Veterinária & Estética',
    beverageTerm: 'Pet Drink / Água',
    supplyTerm: 'Ração / Acessório',
    defaultServices: [
      { 
        name: 'Consulta Geral Veterinária', 
        duration: '45 min', 
        price: 120.00, 
        category: 'Saúde / Clinica',
        description: 'Avaliação clínica minuciosa com verificação de peso, batimentos, ouvidos, dentes e orientações gerais de saúde.',
        image_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Banho & Tosa Premium (Cão)', 
        duration: '90 min', 
        price: 85.00, 
        category: 'Estética / Banho',
        description: 'Banho com shampoo hipoalergênico importado, secagem rápida, tosa higiênica, limpeza de ouvidos e corte de unhas.',
        image_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Vacinação Anual V10 + Raiva', 
        duration: '20 min', 
        price: 140.00, 
        category: 'Saúde / Clinica',
        description: 'Aplicação de dose de vacina múltipla V10 e antirrábica importadas, com registro na carteira pet.',
        image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60'
      },
      { 
        name: 'Tosa da Raça Detalhada', 
        duration: '120 min', 
        price: 110.00, 
        category: 'Estética / Tosa',
        description: 'Tosa estética específica de acordo com o padrão oficial da raça do pet (Poodle, Lhasa, Yorkshire, etc.) feita na tesoura.',
        image_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&auto=format&fit=crop&q=60'
      }
    ]
  }
];

export const getNicheConfig = (id?: string): NicheConfig => {
  return NICHES.find(n => n.id === id) || NICHES[0];
};
