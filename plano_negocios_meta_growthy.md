# PLANO DE NEGÓCIOS & VIABILIDADE FINANCEIRA
**Meta Growthy CRM — SaaS Multi-tenant de Agendamento e Gestão**

Este documento serve como guia estratégico para os sócios **Ramon e Rodrigo** definirem a precificação ideal, os nichos de mercado mais lucrativos e a projeção exata de custos operacionais à medida que a plataforma escala.

---

## 1. SUGESTÃO DE PRECIFICAÇÃO (O QUANTO COBRAR?)
O mercado de CRMs de agendamento no Brasil é muito maduro e os estabelecimentos estão acostumados a pagar mensalidades recorrentes. A nossa vantagem é termos um sistema **limpo, rápido e multi-profissional**.

### Estratégia de Planos Recomendada (Modelo Recorrente SaaS)

#### 🔹 Plano Starter (Foco em Profissionais Autônomos)
*   **Ideal para:** Profissionais que trabalham sozinhos (1 único funcionário cadastrado).
*   **Limitações:** Apenas 1 profissional na agenda, sem controle de comissão complexo.
*   **Preço Sugerido:** **R$ 69,90 / mês** (ou **R$ 599,00 / ano** à vista — equivalente a R$ 49,90/mês).

#### 🔹 Plano Pro (Foco em Pequenos Estabelecimentos) - *O MAIS VENDIDO*
*   **Ideal para:** Equipes de até 5 profissionais (ex: barbearias de bairro, estúdios de tatuagem, salões de beleza).
*   **Recursos inclusos:** Todos os recursos, incluindo controle financeiro completo, comissões de equipe individuais e dashboards.
*   **Preço Sugerido:** **R$ 119,90 / mês** (ou **R$ 999,00 / ano** à vista — equivalente a R$ 83,25/mês).

#### 🔹 Plano Premium/Enterprise (Foco em Grandes Unidades)
*   **Ideal para:** Estabelecimentos com mais de 5 profissionais ou múltiplas unidades.
*   **Recursos inclusos:** Profissionais ilimitados, suporte prioritário e possibilidade de recursos sob demanda.
*   **Preço Sugerido:** **R$ 189,90 / mês** (ou **R$ 1.599,00 / ano** à vista).

---

## 2. NICHOS DE MERCADO DE ALTA CONVERSÃO (ONDE VENDER?)
Como removemos a dependência do nicho de "barbearia", o Meta Growthy CRM tornou-se agnóstico. Seguem os melhores nichos para atacar no Brasil, ordenados pelo nível de facilidade de fechamento:

### ✂️ Nicho 1: Barbearias & Salões de Beleza (Estética Capilar)
*   **Por que focar:** Público já educado. Eles odeiam sistemas lentos ou antigos (como o Trinks ou Avec, que cobram taxas por agendamento). A cobrança fixa mensal do Meta Growthy é um grande atrativo de venda.
*   **Argumento de venda:** *"Chega de dar uma fatia do seu faturamento para plataformas de agendamento. Pague um valor fixo e tenha o controle da sua equipe na sua mão."*

### 💅 Nicho 2: Clínicas de Estética & Lash Designers (Cílios/Sobrancelhas)
*   **Por que focar:** Um dos mercados que mais cresce no Brasil. São negócios altamente visuais que amam designs premium (o visual elegante do Meta Growthy CRM encaixa perfeitamente aqui).
*   **Argumento de venda:** *"Organize seu fluxo de caixa e comissão de suas especialistas de cílios/unhas sem planilhas confusas."*

### 🎨 Nicho 3: Estúdios de Tatuagem e Body Piercing
*   **Por que focar:** Tatuadores são autônomos que odeiam burocracia. O CRM ajuda a controlar a agenda de sessões longas e gerencia a comissão (que costuma ser de 40% a 60% por artista).
*   **Argumento de venda:** *"Gerencie a agenda dos seus artistas residentes e controle a entrada de depósitos de sinal de forma automática."*

### 🐶 Nicho 4: Clínicas Veterinárias & Pet Shops (Banho e Tosa)
*   **Por que focar:** Pet Shops dependem fortemente de recorrência semanal. O agendamento simplificado de banho e tosa e controle financeiro integrado economiza horas do dono do Pet.
*   **Argumento de venda:** *"Não perca mais tempo no WhatsApp agendando banhos. Mande o link para o cliente e deixe a agenda rodar sozinha."*

### 🏋️ Nicho 5: Personal Trainers, Studios de Pilates & Yoga
*   **Por que focar:** Precisam de controle rígido de quem vai a cada aula por hora (limite de alunos por sessão).
*   **Argumento de venda:** *"Ofereça um portal profissional para seus alunos agendarem as aulas de Pilates ou Personal."*

---

## 3. PROJEÇÃO DE CUSTOS OPERACIONAIS (O QUANTO CUSTA ESCALAR?)
O modelo SaaS é o negócio mais lucrativo do mundo porque possui custo marginal quase zero. Você pode ter **10 ou 1.000 clientes** ativos pagando e seus custos fixos vão subir muito pouco.

Aqui está a projeção exata de custos baseados no seu stack tecnológico (Supabase + Next.js na Vercel + Stripe):

### 💸 Custos Iniciais (Fase de Validação — Até 50 Clientes Ativos)
*   **Domínio da Web (Registro.br):** **R$ 40,00 / ano** (para registrar seu `metagrowthy.com.br`).
*   **Servidor (Vercel):** **R$ 0,00 (Plano Gratuito)**. O plano gratuito da Vercel é extremamente generoso e aguenta tranquilamente as visitas de validação de até 50 lojas integradas.
*   **Banco de Dados & Autenticação (Supabase):** **R$ 0,00 (Plano Gratuito)**. O Supabase gratuito dá direito a 500MB de banco de dados (o suficiente para salvar milhões de registros de agendamentos e clientes iniciais) e até 50.000 usuários ativos por mês.
*   **Stripe (Gateway de Pagamentos):** **R$ 0,00 Fixo**. A Stripe cobra apenas uma taxa percentual **por venda aprovada** (aproximadamente 3,99% + R$ 0,39 por transação no cartão). Você só paga se receber!
*   **Custo Mensal Total Inicial:** **R$ 3,33 / mês** (referente ao rateio do domínio).
*   **Margem de Lucro:** **99%**.

---

### 🚀 Custos de Escala (Fase de Crescimento — 50 a 500 Clientes Ativos)
Conforme o sistema cresce, você precisará migrar para as contas profissionais das plataformas para garantir backups diários automáticos, suporte prioritário e maior largura de banda.

#### 1. Hospedagem (Vercel Pro)
*   **Por que pagar:** Exigido pelos termos de uso da Vercel para aplicações comerciais de larga escala. Oferece banda ilimitada e proteção contra quedas.
*   **Valor:** **$ 20,00 USD / mês** (Aproximadamente **R$ 100,00 / mês**).

#### 2. Banco de Dados (Supabase Pro)
*   **Por que pagar:** Aumenta o limite de armazenamento para 8GB, ativa backups automáticos diários em nuvem (segurança contra perda de dados de clientes) e remove a pausa automática de projetos inativos.
*   **Valor:** **$ 25,00 USD / mês** (Aproximadamente **R$ 125,00 / mês**).

#### 3. E-mail Transacional (SendGrid ou Resend)
*   **Por que pagar:** Para garantir que os e-mails de recuperação de senha e confirmação de conta cheguem na caixa de entrada dos clientes sem cair no Spam.
*   **Valor:** **$ 0,00** até 3.000 e-mails/mês (depois custa cerca de **R$ 50,00 / mês**).

#### 4. Disparador de WhatsApp (Opcional - Futuro)
*   **Por que pagar:** Se você decidir implementar um robô que avisa o cliente no WhatsApp dele 2 horas antes do agendamento (um recurso que barbearias amam e pagam caro por ele).
*   **Valor:** Em média **R$ 70,00 a R$ 120,00 / mês** (utilizando APIs não oficiais estáveis como Z-API ou Evolution API).

---

### 📊 Cenário Financeiro Simulado (Com 100 Clientes Pro Ativos)
*   **Faturamento Mensal:** 100 clientes x R$ 119,90 = **R$ 11.990,00 / mês**
*   **Custos Operacionais Fixos (Vercel Pro + Supabase Pro + E-mails):** ~**R$ 275,00 / mês**
*   **Custos de Gateway (Taxa Stripe de ~4%):** ~**R$ 480,00 / mês**
*   **Lucro Líquido:** **R$ 11.235,00 / mês**
*   **Margem de Lucro Real:** **93.7%** 🤯

---

## 4. PRÓXIMAS IMPLEMENTAÇÕES DE ALTO VALOR (DRE COMPLETO)
Como você mencionou o desejo de implementar um **DRE completo (Demonstrativo do Resultado do Exercício)** no futuro, saiba que este é um recurso altamente requisitado por donos de negócios de médio porte.

### Como vender o DRE no futuro:
Você pode manter o CRM com o preço atual de R$ 119,90, e quando finalizarmos o módulo de **DRE, Fluxo de Caixa Avançado e Emissão de Notas Fiscais**, criar um plano chamado **"Meta Growthy Finanças"** por **R$ 199,90/mês**. 
Isso aumentará o seu ticket médio sem afastar os clientes menores que só querem a agenda.

---

Este plano prova que o negócio que você e o Ramon têm em mãos é uma máquina de gerar receita recorrente com custos extremamente baixos. Sucesso na apresentação ao sócio!
