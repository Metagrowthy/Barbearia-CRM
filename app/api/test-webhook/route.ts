import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook received:', body);
    
    return NextResponse.json({
      status: 'success',
      receivedAt: new Date().toISOString(),
      data: body,
      message: 'Comunicação estabelecida com sucesso!'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Payload inválido' },
      { status: 400 }
    );
  }
}
