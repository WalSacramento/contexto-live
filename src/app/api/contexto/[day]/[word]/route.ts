import { NextRequest, NextResponse } from "next/server";

interface ContextoAPIResponse {
  distance?: number;
  lemma?: string;
  word?: string;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ day: string; word: string }> }
) {
  const { day, word } = await params;

  // Validate day is a number
  const dayNum = parseInt(day, 10);
  if (isNaN(dayNum) || dayNum < 1) {
    return NextResponse.json({ error: "Dia inválido" }, { status: 400 });
  }

  // Validate word is not empty
  if (!word || word.trim().length === 0) {
    return NextResponse.json({ error: "Palavra inválida" }, { status: 400 });
  }

  try {
    const apiUrl = `https://api.contexto.me/machado/pt-br/game/${dayNum}/${encodeURIComponent(word.toLowerCase())}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Contexto-Live/1.0",
      },
    });

    const data: ContextoAPIResponse = await response.json();

    // Forward the response
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling Contexto API:", error);
    return NextResponse.json(
      { error: "Erro ao consultar API do Contexto" },
      { status: 500 }
    );
  }
}

