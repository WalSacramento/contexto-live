import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();

    // Contar total de salas criadas (partidas)
    const { count: totalRooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*", { count: "exact", head: true });

    if (roomsError) throw roomsError;

    // Contar total de jogadores únicos
    const { count: totalPlayers, error: playersError } = await supabase
      .from("room_players")
      .select("user_id", { count: "exact", head: true });

    if (playersError) throw playersError;

    return NextResponse.json({
      totalRooms: totalRooms || 0,
      totalPlayers: totalPlayers || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
