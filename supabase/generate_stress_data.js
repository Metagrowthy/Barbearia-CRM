const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytuwhoigabuaaqpzorfw.supabase.co';
// Bypassing RLS with Service Role Key to safely seed mock data
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dXdob2lnYWJ1YWFxcHpvcmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgwMjg0NywiZXhwIjoyMDkyMzc4ODQ3fQ.bSDT_WPCwAkdLF09i31Z4COQidEGn6QFeEqaeZLfSVA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ESTABLISHMENT_ID = 'b35b9057-faf0-47fc-b181-b48e7e75176a';

const targetClients = [
  { name: 'Arthur', phone: '19956564444' },
  { name: 'Benessere Naturale', phone: '+5519982187073' },
  { name: 'Dacio Moraes', phone: '55959595959' },
  { name: 'Don Juan', phone: '55959595944' },
  { name: 'Leandro Neves', phone: '19555654656' },
  { name: 'Rodrigo', phone: '19993644602' },
  { name: 'Rodrigo Santos (Teste Inativo 90 Dias)', phone: '+5519993644604' },
  { name: 'Talles', phone: '19989898989' }
];

const services = [
  { name: 'Corta cabelo', price: 35 },
  { name: 'Barba', price: 25 },
  { name: 'sobrancelha na navalha', price: 35 },
  { name: 'Corte e Barba', price: 60 },
  { name: 'Combo Premium', price: 95 }
];

const barbers = ['Lucas', 'Rodrigo', 'Matheus'];

async function seedData() {
  console.log('Starting DB stress seed process...');

  // 1. Fetch or create clients
  console.log('Ensuring all target clients exist in clients table...');
  const { data: dbClients, error: clientsFetchErr } = await supabase
    .from('clients')
    .select('*')
    .eq('establishment_id', ESTABLISHMENT_ID);
  
  if (clientsFetchErr) {
    console.error('Error fetching clients:', clientsFetchErr);
    return;
  }

  const clientMap = {};
  for (const tc of targetClients) {
    let dbClient = dbClients.find(c => c.phone === tc.phone);
    if (!dbClient) {
      console.log(`Creating client: ${tc.name} (${tc.phone})`);
      const { data: newCli, error: newCliErr } = await supabase
        .from('clients')
        .insert([{
          name: tc.name,
          phone: tc.phone,
          establishment_id: ESTABLISHMENT_ID,
          marketing_stage: 'none',
          total_spent: 0,
          appointments_count: 0
        }])
        .select()
        .single();
      
      if (newCliErr) {
        console.error(`Error inserting client ${tc.name}:`, newCliErr);
        continue;
      }
      dbClient = newCli;
    }
    clientMap[tc.phone] = dbClient;
  }

  // Clear previous mock data for stress testing (clean slate for this establishment)
  console.log('Cleaning up previous appointments and financial records for a clean simulation...');
  
  const { error: delFinErr } = await supabase
    .from('financial_records')
    .delete()
    .eq('establishment_id', ESTABLISHMENT_ID)
    .gt('date', '2026-01-01');
    
  const { error: delAppErr } = await supabase
    .from('appointments')
    .delete()
    .eq('establishment_id', ESTABLISHMENT_ID)
    .eq('source', 'stress_simulation');
  
  if (delFinErr || delAppErr) {
    console.log('Note on deletion:', delFinErr || delAppErr);
  }

  // Reset clients LTV to 0 to let the trigger rebuild them dynamically upon appointment insertion
  console.log('Resetting client stats so the trigger rebuilds their LTVs perfectly...');
  const { error: resetErr } = await supabase
    .from('clients')
    .update({ total_spent: 0, appointments_count: 0, last_visit: null })
    .eq('establishment_id', ESTABLISHMENT_ID);
  
  if (resetErr) console.error('Reset error:', resetErr);

  const appointmentsToInsert = [];
  const financialRecordsToInsert = [];

  const months = [
    { name: 'January', val: 0, days: 31 },
    { name: 'February', val: 1, days: 28 },
    { name: 'March', val: 2, days: 31 },
    { name: 'April', val: 3, days: 30 },
    { name: 'May', val: 4, days: 26 } // Up to May 26
  ];

  console.log('Generating 30 appointments and cash flow per month...');

  for (const m of months) {
    // Generate 30 appointments for this month
    for (let i = 0; i < 30; i++) {
      const client = targetClients[Math.floor(Math.random() * targetClients.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const barber = barbers[Math.floor(Math.random() * barbers.length)];
      const day = Math.floor(Math.random() * m.days) + 1;
      
      const dateStr = `2026-${String(m.val + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hour = String(Math.floor(Math.random() * 11) + 8).padStart(2, '0'); // 08h to 18h
      const minute = Math.random() > 0.5 ? '00' : '30';
      const timeStr = `${hour}:${minute}:00`;
      
      // Status split: 85% completed, 10% scheduled, 5% cancelled
      const randStatus = Math.random();
      let status = 'concluido';
      if (randStatus > 0.95) status = 'cancelado';
      else if (randStatus > 0.85) status = 'agendado';

      const appPayload = {
        client_name: client.name,
        client_phone: client.phone,
        barber_name: barber,
        service_name: service.name,
        appointment_date: dateStr,
        start_time: timeStr,
        end_time: `${hour}:${minute === '00' ? '45' : '15'}:00`,
        duration_minutes: 45,
        price: service.price,
        additional_price: status === 'concluido' && Math.random() > 0.6 ? Math.floor(Math.random() * 16) + 5 : 0, // Gorjeta
        status: status,
        establishment_id: ESTABLISHMENT_ID,
        source: 'stress_simulation'
      };

      appointmentsToInsert.push(appPayload);
    }

    // Generate monthly expenses (Saídas)
    // 1. Rent (Aluguel)
    financialRecordsToInsert.push({
      description: 'Aluguel Comercial - Sala',
      amount: 1500,
      type: 'expense',
      category: 'Aluguel & Contas',
      date: `2026-${String(m.val + 1).padStart(2, '0')}-05`,
      establishment_id: ESTABLISHMENT_ID
    });

    // 2. Electricity & Water (Contas)
    financialRecordsToInsert.push({
      description: 'Conta de Energia + Água',
      amount: Math.floor(Math.random() * 150) + 320,
      type: 'expense',
      category: 'Aluguel & Contas',
      date: `2026-${String(m.val + 1).padStart(2, '0')}-12`,
      establishment_id: ESTABLISHMENT_ID
    });

    // 3. Marketing Ads
    financialRecordsToInsert.push({
      description: 'Campanha Tráfego Pago (Instagram Ads)',
      amount: 250,
      type: 'expense',
      category: 'Marketing',
      date: `2026-${String(m.val + 1).padStart(2, '0')}-15`,
      establishment_id: ESTABLISHMENT_ID
    });

    // 4. Inventory supply purchases (2 per month)
    financialRecordsToInsert.push({
      description: 'Compra de Insumos (Shampoo, Pomadas, Golas)',
      amount: Math.floor(Math.random() * 200) + 350,
      type: 'expense',
      category: 'Estoque',
      date: `2026-${String(m.val + 1).padStart(2, '0')}-08`,
      establishment_id: ESTABLISHMENT_ID
    });
    financialRecordsToInsert.push({
      description: 'Reposição Bebidas (Heineken, Refrigerante)',
      amount: Math.floor(Math.random() * 150) + 200,
      type: 'expense',
      category: 'Estoque',
      date: `2026-${String(m.val + 1).padStart(2, '0')}-22`,
      establishment_id: ESTABLISHMENT_ID
    });

    // 5. Product sales manually registered (Entradas de produtos)
    const productSalesCount = Math.floor(Math.random() * 5) + 6; // 6 to 10 product sales
    for (let j = 0; j < productSalesCount; j++) {
      const day = Math.floor(Math.random() * m.days) + 1;
      financialRecordsToInsert.push({
        description: 'Venda de Pomada Capilar / Óleo para Barba',
        amount: Math.random() > 0.5 ? 50 : 25,
        type: 'income',
        category: 'Venda de Produtos',
        date: `2026-${String(m.val + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        establishment_id: ESTABLISHMENT_ID
      });
    }
  }

  // Insert appointments
  console.log(`Inserting ${appointmentsToInsert.length} simulated appointments...`);
  // Insert in chunks of 50 to be safe
  for (let c = 0; c < appointmentsToInsert.length; c += 50) {
    const chunk = appointmentsToInsert.slice(c, c + 50);
    const { data: insertedApps, error: appInsErr } = await supabase
      .from('appointments')
      .insert(chunk)
      .select();

    if (appInsErr) {
      console.error('Error inserting appointments chunk:', appInsErr);
      return;
    }

    // For completed appointments in this chunk, create a linked financial record
    for (const app of insertedApps) {
      if (app.status === 'concluido') {
        financialRecordsToInsert.push({
          description: `Atendimento: ${app.client_name}`,
          amount: Number(app.price) + Number(app.additional_price),
          additional_price: Number(app.additional_price),
          type: 'income',
          category: 'Serviço',
          date: app.appointment_date,
          appointment_id: app.id,
          establishment_id: ESTABLISHMENT_ID
        });
      }
    }
  }

  // Insert financial records
  console.log(`Inserting ${financialRecordsToInsert.length} cash flow records (including services and expenses)...`);
  for (let c = 0; c < financialRecordsToInsert.length; c += 50) {
    const chunk = financialRecordsToInsert.slice(c, c + 50);
    const { error: finInsErr } = await supabase
      .from('financial_records')
      .insert(chunk);

    if (finInsErr) {
      console.error('Error inserting financial records chunk:', finInsErr);
      return;
    }
  }

  console.log('DB seeding completely successfully! All stats updated and cash flow populated.');
}

seedData();
