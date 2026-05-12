import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos uma inicialização separada aqui para o backend usando a chave anônima (ou service role se houvesse)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// ATENÇÃO: Usamos a Service Role Key para ignorar as regras RLS (pois o n8n é um bot e não tem sessão de usuário)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const N8N_API_KEY = process.env.N8N_API_KEY || 'vck_3UZzPv5ZDP7vfRi5cqiL9NsPLFXT9UPfgS2izXptWJVGVKvtGj3rvOyF'; // default para facilitar o teste

// Middleware manual para checar API key
function checkApiKey(request: Request) {
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');
  
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : apiKeyHeader;

  if (!token || token !== N8N_API_KEY) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  try {
    if (!checkApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let date = searchParams.get('date') || searchParams.get('data'); 
    const barber = searchParams.get('barber') || searchParams.get('barbeiro') || searchParams.get('nome_barbeiro') || searchParams.get('nome');
    const client = searchParams.get('client') || searchParams.get('nome_cliente');
    const phone = searchParams.get('phone') || searchParams.get('telefone') || searchParams.get('numero');
    const time = searchParams.get('time') || searchParams.get('hora');
    const establishmentId = searchParams.get('establishment_id');

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials missing on server' }, { status: 500 });
    }

    if (!date && !client && !phone && !barber) {
      return NextResponse.json({ error: 'Parâmetros insuficientes' }, { status: 400 });
    }

    if (!date || date === 'YYYY-MM-DD') {
      const today = new Date();
      date = (date === 'YYYY-MM-DD' || !date) 
        ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        : date;
    }

    // Converter DD/MM/YYYY para YYYY-MM-DD se necessário
    if (date && date.includes('/')) {
      const parts = date.split('/');
      if (parts.length === 3 && parts[0].length <= 2) {
        date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('appointments')
      .select('*')
      .neq('status', 'cancelado');

    if (establishmentId) {
      query = query.eq('establishment_id', establishmentId);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    if (time) {
      const formattedTime = time.length === 5 ? `${time}:00` : time;
      query = query.eq('start_time', formattedTime);
    }

    if (barber) {
      query = query.eq('barber_name', barber);
    }

    if (phone) {
      query = query.eq('client_phone', phone);
    } else if (client) {
      query = query.ilike('client_name', `%${client}%`);
    }

    const { data: appointments, error } = await query.order('start_time', { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se a consulta foi por barbeiro + data + hora, indicamos se está livre
    const isSlotOccupied = (barber && date && time) ? (appointments && appointments.length > 0) : false;

    return NextResponse.json({
      available: !isSlotOccupied,
      appointments: appointments,
      message: isSlotOccupied ? 'Horário já está ocupado.' : 'Horário disponível.',
      total: appointments?.length || 0,
      filters: { date, barber, time, client, phone }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!checkApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição vazio ou JSON inválido. Certifique-se de ativar "Send Body" no n8n.' }, { status: 400 });
    }
    
    // Suporte flexível para n8n mandando chaves em PT-BR ou EN
    const client = body.client || body.nome || body.client_name;
    const phone = body.phone || body.telefone || body.numero || body.celular || body.client_phone || '';
    let barber = body.barber || body.barbeiro || body.barber_name || 'Profissional'; // Default se a IA não mandar
    const service = body.service || body.servico || body.service_name;
    let date = body.date || body.data || body.appointment_date;
    const time = body.time || body.hora || body.start_time;
    const durationMinutes = body.durationMinutes || body.duracao || 45;
    const price = body.price || body.preco || body.valor || 0;
    const establishmentId = body.establishment_id;

    // Converter DD/MM/YYYY para YYYY-MM-DD se necessário
    if (date && date.includes('/')) {
      const parts = date.split('/');
      if (parts.length === 3 && parts[0].length <= 2) {
        // Assume DD/MM/YYYY
        date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    if (!client || !service || !date || !time || !establishmentId) {
      return NextResponse.json({ error: 'Faltam parâmetros (nome, servico, data, hora, establishment_id)' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials missing on server' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculando o horário final
    const [hours, minutes] = time.split(':').map(Number);
    const duration = durationMinutes || 45; // default 45
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

    // Verifica disponibilidade primeiro para evitar conflitos! (Double booking check)
    const { data: existingApts, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('establishment_id', establishmentId)
      .eq('appointment_date', date)
      .eq('barber_name', barber)
      .eq('start_time', `${time}:00`)
      .neq('status', 'cancelado');

    if (checkError) throw checkError;

    if (existingApts && existingApts.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Conflito: ${barber} já tem um agendamento neste horário (${time}).` 
      }, { status: 409 });
    }

    const dbPayload = {
      client_name: client,
      client_phone: phone,
      barber_name: barber,
      service_name: service,
      establishment_id: establishmentId,
      appointment_date: date,
      start_time: `${time}:00`,
      end_time: endTimeStr,
      duration_minutes: duration,
      price: price || 0,
      color_class: "bg-blue-50 border-blue-400 text-blue-700", // color default from n8n 
      status: "confirmado",
    };

    const { data: insertedData, error } = await supabase
      .from('appointments')
      .insert([dbPayload])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Agendamento criado com sucesso via n8n!',
      appointment: insertedData[0]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!checkApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição vazio ou JSON inválido. Use "Send Body" no n8n.' }, { status: 400 });
    }
    
    const client = body.client || body.nome || body.client_name;
    const phone = body.phone || body.telefone || body.numero || body.celular || body.client_phone;
    let oldDate = body.old_date || body.data_antiga || body.date;
    const oldTime = body.old_time || body.hora_antiga || body.time;
    let newDate = body.new_date || body.nova_data;
    const newTime = body.new_time || body.nova_hora;
    const establishmentId = body.establishment_id;

    // Converter DD/MM/YYYY para YYYY-MM-DD se necessário
    if (oldDate && oldDate.includes('/')) {
      const parts = oldDate.split('/');
      if (parts.length === 3 && parts[0].length <= 2) {
        oldDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    if (newDate && newDate.includes('/')) {
      const parts = newDate.split('/');
      if (parts.length === 3 && parts[0].length <= 2) {
        newDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Se nao enviou nova data, assume que apenas altera a hora no mesmo dia
    if (!newDate) newDate = oldDate;

    if (!client || !oldDate || !oldTime || !newTime || !establishmentId) {
      return NextResponse.json({ error: 'Faltam parâmetros (nome, data_antiga, hora_antiga, nova_hora, establishment_id)' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials missing on server' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Encontrar o agendamento original
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('establishment_id', establishmentId);
      
    if (phone) {
      query = query.eq('client_phone', phone);
    } else {
      query = query.ilike('client_name', `%${client}%`); // fallback se nao mandar telefone
    }

    const { data: existingAppts, error: fetchError } = await query
      .eq('appointment_date', oldDate)
      .eq('start_time', `${oldTime.substring(0, 5)}:00`)
      .neq('status', 'cancelado')
      .limit(1);

    if (fetchError) throw fetchError;

    if (!existingAppts || existingAppts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Nenhum agendamento encontrado para ${client} no dia ${oldDate} às ${oldTime}.` 
      }, { status: 404 });
    }

    const appointment = existingAppts[0];

    // Calculando novo horário final
    const [hours, minutes] = newTime.split(':').map(Number);
    const duration = appointment.duration_minutes || 45;
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

    // Atualizar
    const { data: updatedData, error: updateError } = await supabase
      .from('appointments')
      .update({
        appointment_date: newDate,
        start_time: `${newTime}:00`,
        end_time: endTimeStr
      })
      .eq('id', appointment.id)
      .select();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Agendamento remarcado com sucesso!',
      appointment: updatedData[0]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!checkApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição vazio ou JSON inválido. Use "Send Body" no n8n.' }, { status: 400 });
    }
    
    const client = body.client || body.nome || body.client_name;
    const phone = body.phone || body.telefone || body.numero || body.celular || body.client_phone;
    let date = body.date || body.data;
    const time = body.time || body.hora;
    const establishmentId = body.establishment_id;

    // Converter DD/MM/YYYY para YYYY-MM-DD
    if (date && date.includes('/')) {
      const parts = date.split('/');
      if (parts.length === 3 && parts[0].length <= 2) {
        date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    if (!client || !date || !time || !establishmentId) {
      return NextResponse.json({ error: 'Faltam parâmetros (nome, data, hora, establishment_id)' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials missing on server' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Encontrar o agendamento original
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('establishment_id', establishmentId);

    if (phone) {
      query = query.eq('client_phone', phone);
    } else {
      query = query.ilike('client_name', `%${client}%`);
    }

    const { data: existingAppts, error: fetchError } = await query
      .eq('appointment_date', date)
      .eq('start_time', `${time.substring(0, 5)}:00`)
      .neq('status', 'cancelado')
      .limit(1);

    if (fetchError) throw fetchError;

    if (!existingAppts || existingAppts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Nenhum agendamento encontrado para ${client} no dia ${date} às ${time}.` 
      }, { status: 404 });
    }

    // Cancelar (soft delete mudando o status)
    const appointmentId = existingAppts[0].id;
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelado' })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Agendamento cancelado com sucesso!'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
