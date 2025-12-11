import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client para backend
function getSupabaseBackend() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configuração inválida: Supabase credentials não encontradas");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseBackend();
    const body = await request.json();
    const { roomId, userId } = body;

    // 1. Validar parâmetros
    if (!roomId || !userId) {
      return NextResponse.json(
        { error: "Parâmetros inválidos: roomId e userId são obrigatórios" },
        { status: 400 }
      );
    }

    // 2. Chamar RPC para criar rematch room
    const { data, error } = await supabase.rpc("create_rematch_room", {
      p_parent_room_id: roomId,
      p_user_id: userId,
    });

    if (error) {
      console.error("Error creating rematch room:", error);
      return NextResponse.json(
        { error: "Erro ao criar sala de rematch" },
        { status: 500 }
      );
    }

    // 3. Verificar se houve erro retornado pelo RPC
    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }

    // 4. Retornar sucesso com novo room_id
    return NextResponse.json({
      success: true,
      room_id: data.room_id,
      game_mode: data.game_mode,
    });

  } catch (error) {
    console.error("Error in rematch endpoint:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
