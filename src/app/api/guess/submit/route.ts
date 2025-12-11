import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to get Supabase client for backend
function getSupabaseBackend() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Configuração inválida: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias."
    );
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
    const { roomId, userId, word } = body;

    if (!roomId || !userId || !word) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("game_mode, game_day, status")
      .eq("id", roomId)
      .single();

    if (roomError || !roomData) {
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      );
    }

    if (roomData.status !== "playing") {
      return NextResponse.json(
        { error: "O jogo não está em andamento" },
        { status: 400 }
      );
    }

    let validatedRank: number;

    if (roomData.game_mode === "contexto") {
      if (!roomData.game_day) {
        return NextResponse.json(
          { error: "Dia do jogo não encontrado" },
          { status: 500 }
        );
      }

      const contextoUrl = `https://api.contexto.me/machado/pt-br/game/${roomData.game_day}/${encodeURIComponent(word.toLowerCase().trim())}`;

      const contextoResponse = await fetch(contextoUrl, {
        headers: {
          "User-Agent": "ContextoLive/1.0",
        },
      });

      if (!contextoResponse.ok) {
        return NextResponse.json(
          { error: "Erro ao validar palavra com Contexto.me" },
          { status: 502 }
        );
      }

      const contextoData = await contextoResponse.json();

      if (contextoData.error) {
        return NextResponse.json(
          { error: contextoData.error },
          { status: 400 }
        );
      }

      validatedRank = (contextoData.distance ?? 0) + 1;

    } else {
      const { data: submitData, error: submitError } = await supabase.rpc(
        "submit_guess",
        {
          p_room_id: roomId,
          p_user_id: userId,
          p_word: word,
        }
      );

      if (submitError) {
        return NextResponse.json(
          { error: "Erro ao processar palpite" },
          { status: 500 }
        );
      }

      return NextResponse.json(submitData);
    }

    const { data: saveData, error: saveError } = await supabase.rpc(
      "save_guess",
      {
        p_room_id: roomId,
        p_user_id: userId,
        p_word: word.toLowerCase().trim(),
        p_rank: validatedRank,
      }
    );

    if (saveError) {
      console.error("Error in save_guess:", saveError);
      return NextResponse.json(
        { error: "Erro ao salvar palpite" },
        { status: 500 }
      );
    }

    return NextResponse.json(saveData);

  } catch (error) {
    console.error("Error in submit endpoint:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
